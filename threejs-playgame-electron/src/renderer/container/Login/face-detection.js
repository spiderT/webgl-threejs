import * as faceapi from 'face-api.js';
// https://github.com/justadudewhohacks/face-api.js#face-api.js-for-nodejs
// browser 和 node 环境的处理方法不一样
import * as canvas from 'canvas';
import '@tensorflow/tfjs-node';
import {ipcRenderer} from 'electron';
const {
  Canvas,
  Image,
  ImageData
} = canvas
faceapi.env.monkeyPatch({
  Canvas,
  Image,
  ImageData
})

const errorMap = {
  NotAllowedError: "摄像头已被禁用，请在当前浏览器设置中开启后重试",
  AbortError: "硬件问题，导致无法访问摄像头",
  NotFoundError: "未检测到可用摄像头",
  NotReadableError: "操作系统上某个硬件、浏览器或者网页层面发生错误，导致无法访问摄像头",
  OverConstrainedError: "未检测到可用摄像头",
  SecurityError: "摄像头已被禁用，请在系统设置或者浏览器设置中开启后重试",
  TypeError: "类型错误，未检测到可用摄像头"
};

class FaceDetection {
  constructor(options) {
    this.options = Object.assign({
        matchedScore: 0.7,
        matchedDistance: 0.5,
      },
      options
    );

    this.timer = null;
    this.mediaStreamTrack = null; // 摄像头媒体流
    this.descriptors = {
      data1: null,
      data2: null
    }; // 两种数据

    this.videoEl = document.querySelector("#videoEl"); // 视频区域
    this.canvasImgEl = document.querySelector("#canvasImg"); // 图片绘制区域
    this.loadingEl = document.querySelector("#loading");
    this.successEl = document.querySelector("#success");
    this.errorEl = document.querySelector("#error");

    this.init();
  }

  async init() {
    await this.initDetection();
    this.loadFaceImage();
  }

  // 初始化人脸识别
  async initDetection() {
    // 加载模型
    // ageGenderNet
    // faceExpressionNet
    // faceLandmark68Net
    // faceLandmark68TinyNet
    // faceRecognitionNet
    // ssdMobilenetv1
    // tinyFaceDetector
    // tinyYolov2

    await faceapi.nets.faceExpressionNet.loadFromUri('../../../resources/models')
    await faceapi.nets.tinyFaceDetector.loadFromUri('../../../resources/models')
    await faceapi.nets.ssdMobilenetv1.loadFromUri('../../../resources/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('../../../resources/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('../../../resources/models')


    const mediaOpt = {
      video: true
    };
    // 获取 WebRTC 媒体视频流
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // 最新标准API
      this.mediaStreamTrack = await navigator.mediaDevices
        .getUserMedia(mediaOpt)
        .catch(this.mediaErrorCallback);
    }
    this.initVideo();
  }

  // 初始化视频流
  initVideo() {
    this.videoEl.onplay = () => {
      this.onPlay();
    };
    this.videoEl.srcObject = this.mediaStreamTrack;
    setTimeout(() => this.onPlay(), 300);
  }

  // 获取媒体流错误处理
  mediaErrorCallback(error) {
    if (errorMap[error.name]) {
      alert(errorMap[error.name]);
    }
  }

  // 循环监听扫描视频流中的人脸特征
  async onPlay() {
    // 判断视频对象是否暂停结束
    if (this.videoEl && (this.videoEl.paused || this.videoEl.ended)) {
      this.timer = setTimeout(() => this.onPlay());
      return;
    }

    // 设置 TinyFaceDetector 模型参数：inputSize 输入视频流大小  scoreThreshold 人脸评分阈值
    const faceDetectionTask = await faceapi.detectSingleFace(
      this.videoEl,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.6
      })
    );

    // 判断人脸扫描结果
    if (faceDetectionTask) {
      if (faceDetectionTask.score > this.options.matchedScore) {
        console.log(`检测到人脸，匹配度${faceDetectionTask.score }大于 ${this.options.matchedScore}`);
        // 人脸符合要求，暂停视频流
        this.videoEl.pause();
        // 识别loading
        this.loadingEl.style.display = 'block';
        this.canvasImgEl
          .getContext("2d")
          .drawImage(
            this.videoEl,
            0,
            0,
            this.canvasImgEl.width,
            this.canvasImgEl.height
          );
        // 将绘制的图像转化成 图片的 base64 编码
        let image = this.canvasImgEl.toDataURL("image/png");
        this.descriptors.data2 = image;
        // 进行身份验证
        this.recognitionFace();
      }
    }
    this.timer = setTimeout(() => this.onPlay());
  }

  recognitionFace() {
    const img1 = document.createElement("img");
    const img2 = document.createElement("img");
    img1.src = this.descriptors.data1;
    img2.src = this.descriptors.data2;

    // document.body.appendChild(img1);
    // document.body.appendChild(img2);

    setTimeout(async () => {
      const data1 = await faceapi.computeFaceDescriptor(img1);
      const data2 = await faceapi.computeFaceDescriptor(img2);

      const distance = faceapi.utils.round(
        faceapi.euclideanDistance(data1, data2)
      );

      console.log("distance", distance);
      this.loadingEl.style.display = 'none';
      if (distance < this.options.matchedDistance) {
        // 识别成功，识别loading消失，提示成功
        this.successEl.style.display = 'block';
        setTimeout(() => {
          this.successEl.style.display = 'none'
        }, 1000)
        // 跳转页面
        ipcRenderer.send('login-success');
      } else {
        // 识别失败，识别loading消失，提示失败
        this.errorEl.style.display = 'block';
        setTimeout(() => {
          this.errorEl.style.display = 'none'
        }, 1000)
      }
    }, 300);
  }

  loadFaceImage() {
    // 需要被验证一致的图
    const url = "../../../resources/images/p1.png"; // 0.39

    this.convertImgToBase64(url, base64Img => {
      //转化后的base64
      this.descriptors.data1 = base64Img;
    });
  }

  convertImgToBase64(url, callback) {
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d"),
      img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      canvas.height = img.height;
      canvas.width = img.width;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      callback.call(this, dataURL);
    };
    img.src = url;
  }
}

module.exports = FaceDetection;