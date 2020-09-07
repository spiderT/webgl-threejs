import * as THREE from 'three';
import {
  GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';
const loader = new GLTFLoader();

let textMesh;

/**
 * 创建光源
 * @param {*} scene 
 */
function createLights(scene) {
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(3, 10, 10);
  scene.add(dirLight);
}

/**
 * 创建地面
 * @param {*} scene 
 */
function createGround(scene) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2000, 2000),
    new THREE.MeshPhongMaterial({
      color: 0x999999,
      depthWrite: false
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);
}

/**
 * 加载model
 * @param {*} scene 
 * @param {*} path 
 * @param {*} modelSettings 
 * @param {*} action 
 */
function loadModel(scene, path, modelSettings, action) {
  loader.load(path, function (gltf) {
    let model = gltf.scene;
    modelSettings && modelSettings(model);
    scene.add(model);
    action && action(model, gltf);
  });
}

/**
 * 移除model
 * @param {*} scene 
 * @param {*} model 
 */
function removeModel(scene, model) {
  scene.remove(model);
}

/**
 * 窗口自适应
 * @param {*} camera 
 * @param {*} renderer 
 */
function onWindowResize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 创建文字
 * @param {*} font 
 * @param {*} scene 
 * @param {*} text 
 * @param {*} xPosition 
 * @param {*} yPosition 
 * @param {*} zPosition 
 */
function createText(font, scene, text, xPosition, yPosition, zPosition) {
  if (textMesh) {
    scene.remove(textMesh)
  }
  const textGeo = new THREE.TextGeometry(text, {
    font,
    size: 0.5, // 字号大小，一般为大写字母的高度
    height: 0, // 文字的厚度
    curveSegments: 12, // 弧线分段数，使得文字的曲线更加光滑
    bevelThickness: 1, // 倒角厚度
    bevelSize: 1, // 倒角宽度
    bevelEnabled: false // 布尔值，是否使用倒角，意为在边缘处斜切
  });

  textMesh = new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial({
    color: 0x444444,
  }))
  textMesh.position.x = xPosition;
  textMesh.position.y = yPosition;
  textMesh.position.z = zPosition;
  scene.add(textMesh);
}

export {
  createLights,
  createGround,
  loadModel,
  removeModel,
  onWindowResize,
  createText
}