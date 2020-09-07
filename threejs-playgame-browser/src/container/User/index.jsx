import React, { useState, useEffect, useRef } from 'react';
import './index.scss';
import * as THREE from 'three';
import { STATES, EMOTES, MSG_ACTION_RULE } from '../../constants';
import { createLights, createGround, onWindowResize, loadModel, removeModel, createText } from './utils';
import Bus from '../../eventBus';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';

const clock = new THREE.Clock();

export default function User() {
  let renderer,
    scene,
    camera,
    stats,
    mixer,
    actions,
    activeAction,
    previousAction,
    mixer2,
    font,
    guestAnimations,
    guestModel;
  let api = { state: 'Idle' };
  const canvasRef = useRef();

  useEffect(() => {
    init();
    animate();
  }, []);

  // 设置场景
  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe0e0e0);
    scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);
  }

  // 可以通过调整position，看到不同的效果
  function initCamera() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);
    camera.position.set(-10, 3, 10);
    camera.lookAt(new THREE.Vector3(0, 2, 0));
  }

  // stats
  function initStats() {
    stats = new Stats();
    stats.dom.style.position = 'absolute';
    stats.dom.style.left = '140px';
    stats.dom.style.bottom = '10px';
    stats.dom.style.top = null; // 解决bottom不生效
    canvasRef.current.appendChild(stats.dom);
  }

  // 加载字体文件
  function loadFont() {
    const fontLoader = new THREE.FontLoader();
    fontLoader.load('/resources/fonts/helvetiker_regular.typeface.json', (response) => (font = response));
  }

  // 渲染器
  function initRender() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    canvasRef.current.appendChild(renderer.domElement);
  }

  // 控制窗口视图
  function initControls() {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.target.set(0, 1, 0);
    controls.update();
  }

  function init() {
    initCamera();
    initStats();
    initScene();
    initRender();
    initControls();

    // lights
    createLights(scene);

    // ground
    createGround(scene);

    // 加载font
    loadFont();

    // 人物模型
    loadModel(
      scene,
      require('../../resources/gltf/Xbot.glb'),
      (model) => {
        guestModel = model;
        // 移动距离
        model.position.set(0, 0, 5);
        // 旋转，面对面
        model.rotation.y = -Math.PI;
      },
      (model, gltf) => changeActionByGuest(model, gltf)
    );

    // 机器人模型
    loadModel(
      scene,
      require('../../resources/gltf/RobotExpressive.glb'),
      (model) => {
        // 移动距离
        model.position.set(0, 0, 0);
      },
      (model, gltf) => changeActionBySystem(model, gltf.animations)
    );

    window.addEventListener('resize', () => onWindowResize(camera, renderer), false);
  }

  function changeActionByGuest(model, gltf) {
    guestAnimations = gltf.animations;
    mixer2 = new THREE.AnimationMixer(model);
  }

  // 监听变化
  Bus.addListener('changeSystemStatus', (msg) => {
    fadeToAction(msg, 0.5);
  });

  Bus.addListener('createGuestText', (msg) => {
    createText(font, scene, msg, 17, 0, -4);
  });

  Bus.addListener('createSystemText', (msg) => {
    createText(font, scene, msg, 0, 5, -4);
  });

  Bus.addListener('changeGuestStatus', (msg) => {
    // Animations元素: agree headShake idle run sad_pose sneak_pose walk
    let number = 2;
    const rule = MSG_ACTION_RULE[msg];
    if (rule === 'yes') {
      number = 0;
    } else if (rule === 'no') {
      number = 1;
    } else if (rule === 'walk') {
      number = 6;
    } else if (rule === 'run') {
      number = 3;
    } else if (rule === 'bye') {
      // 移除模型
      removeModel(scene, guestModel);
    }
    mixer2.clipAction(guestAnimations[number]).play();
  });

  function changeActionBySystem(model, animations) {
    mixer = new THREE.AnimationMixer(model);
    actions = {};

    for (let i = 0; i < animations.length; i++) {
      let clip = animations[i];
      let action = mixer.clipAction(clip);
      actions[clip.name] = action;
      if (EMOTES.indexOf(clip.name) >= 0 || STATES.indexOf(clip.name) >= 4) {
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
      }
    }

    // EMOTES
    function createEmoteCallback(name) {
      api[name] = function () {
        fadeToAction(name, 0.2);
        mixer.addEventListener('finished', restoreState);
      };
    }

    function restoreState() {
      mixer.removeEventListener('finished', restoreState);
      fadeToAction(api.state, 0.2);
    }

    for (let i = 0; i < EMOTES.length; i++) {
      createEmoteCallback(EMOTES[i]);
    }

    activeAction = actions['Idle'];
    activeAction.play();
  }

  // 动作切换
  function fadeToAction(name, duration) {
    previousAction = activeAction;
    activeAction = actions[name];
    if (previousAction !== activeAction) {
      previousAction.fadeOut(duration);
    }

    activeAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
  }

  function animate() {
    const dt = clock.getDelta();
    if (mixer) mixer.update(dt);
    if (mixer2) mixer2.update(dt);
    requestAnimationFrame(animate);
    stats && stats.update();
    renderer.render(scene, camera);
  }

  return <div className="canvas-wrap" ref={canvasRef} />;
}
