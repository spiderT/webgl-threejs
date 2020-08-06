import React, { useState, useEffect, useRef } from 'react';
import './index.scss';
import * as THREE from 'three';
import { STATES, EMOTES } from '../../constants';
import { createLights, createGround, onWindowResize, loadModel, removeModel, createText } from './utils';
import Bus from '../../../eventBus';
const fontLoader = new THREE.FontLoader();

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);

export default function User() {
  let clock, mixer, actions, activeAction, previousAction, mixer2;
  let api = { state: 'Idle' };
  let studentAnimations;
  let font;

  const canvasRef = useRef();

  useEffect(() => {
    init();
    animate();
  }, []);

  function init() {
    // 可以通过调整position，看到不同的效果
    camera.position.set(-10, 3, 10);
    camera.lookAt(new THREE.Vector3(0, 2, 0));

    scene.background = new THREE.Color(0xe0e0e0);
    scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

    clock = new THREE.Clock();

    // lights
    createLights(scene);

    // ground
    createGround(scene);

    // 加载font
    fontLoader.load('/resources/fonts/helvetiker_regular.typeface.json', (response) => (font = response));

    // 第一个模型
    loadModel(
      scene,
      require('../../../resources/gltf/Xbot.glb'),
      (model) => {
        // 移动距离
        model.position.set(0, 0, 5);
        // 旋转，面对面
        model.rotation.y = -Math.PI;
      },
      (model, gltf) => changeActionByMan(model, gltf)
    );

    // 第二个模型
    loadModel(
      scene,
      require('../../../resources/gltf/RobotExpressive.glb'),
      (model) => {
        // 移动距离
        model.position.set(0, 0, 0);
      },
      (model, gltf) => changeActionByRobot(model, gltf.animations)
    );

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    canvasRef.current.appendChild(renderer.domElement);

    window.addEventListener('resize', () => onWindowResize(camera, renderer), false);
  }

  function changeActionByMan(model, gltf) {
    studentAnimations = gltf.animations;
    mixer2 = new THREE.AnimationMixer(model);
  }

  function activateManAction(action) {
    action.play();
  }

  // 监听变化
  Bus.addListener('changeTeacherStatus', (msg) => {
    fadeToAction(msg, 0.5);
  });

  Bus.addListener('createStudentText', (msg) => {
    createText(font, scene, msg, 17, 0, -4);
  });

  Bus.addListener('createTeacherText', (msg) => {
    createText(font, scene, msg, 0, 5, -4);
  });

  Bus.addListener('changeStudentStatus', (msg) => {
    // studentAnimations元素: agree headShake idle run sad_pose sneak_pose walk
    let number = 2;
    if (msg === 'yes') {
      number = 0;
    } else if (msg === 'no') {
      number = 1;
    } else if (msg === 'walk') {
      number = 6;
    } else if (msg === 'run') {
      number = 3;
    } else if (msg === 'bye') {
      // todo 人物旋转离开，移除模型
      // removeModel()
      console.log('mixer2' ,mixer2)
    }
    activateManAction(mixer2.clipAction(studentAnimations[number]));
  });

  function changeActionByRobot(model, animations) {
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
    renderer.render(scene, camera);
  }

  return <div className="canvas-wrap" ref={canvasRef} />;
}
