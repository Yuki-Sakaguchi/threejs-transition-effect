import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import fragment from './shader/fragment.glsl';
import vertex from './shader/vertex.glsl';
import GUI from 'lil-gui';
import gsap from 'gsap';

import t1 from '../t1.jpg';
import t2 from '../t2.jpg';
import t3 from '../t3.jpg';
import mask from '../mask.jpg';

// addon
// https://threejs.org/docs/#manual/en/introduction/How-to-use-post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

// 自作のシェーダー （参考：https://threejs.org/examples/jsm/shaders/DotScreenShader.js）
// import { DotScreenShader } from './dotEffect.js';
import { CurtainShader } from './effect.js';
import { RGBAShader } from './effect2.js';

// https://github.com/mattdesl/simple-input-events
const createInputEvents = require('simple-input-events');

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      1,
      3000
    );

    this.event = createInputEvents(this.renderer.domElement);

    // const size = 10;
    // const aspect = wiindow.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera(size * aspect / 2, size * aspect / 2, size / 2, size / 2, -1000, 1000);

    this.camera.position.set(0, 0, 900);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.step = 0;
    this.time = 0;
    this.mouse = new THREE.Vector2();
    this.mouseTarget = new THREE.Vector2();

    this.isPlaying = true;

    this.initPost();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.events();
    this.initSettings();

    // マスクを生のcanvasでやるならこんな感じ
    //   let canvas = document.createElement('canvas');
    //   document.body.appendChild(canvas);
    //   let ctx = canvas.getContext('2d');
    //   canvas.width = 1920;
    //   canvas.height = 1080;

    //   let img = new Image();
    //   let maskImg = new Image();

    //   maskImg.onload = () => {
    //     ctx.globalCompositeOperation = 'source-over';
    //     ctx.drawImage(maskImg, 0, 0);
    //     ctx.globalCompositeOperation = 'source-in';
    //     ctx.drawImage(img, 0, 0);
    //   };

    //   img.src = t1;
    //   maskImg.src = mask;

  }

  initPost() {
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass)

    this.effectPass = new ShaderPass(CurtainShader);
    this.composer.addPass(this.effectPass);

    this.effectPass2 = new ShaderPass(RGBAShader);
    this.composer.addPass(this.effectPass2);
  }

  events() {
    this.event.on('move', ({ uv }) => {
      this.mouse.x = uv[0] - 0.5;
      this.mouse.y = uv[1] - 0.5;
    });
  }

  initSettings() {
    this.settings = {
      progress: 0,
      progress1: 0,
      runAnimation: () => {
        this.runAnimation();
      },
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "progress1", 0, 1, 0.01).onChange(val => {
      this.effectPass.uniforms.uProgress.value = val;
    });
    this.gui.add(this.settings, 'runAnimation');
  }

  runAnimation() {
    let tl = gsap.timeline();

    this.step++;
    let target = this.step * 2500;
    if (this.step >= this.textures.length) {
      target = 0;
      this.step = 0;
    }

    // カメラを移動させる
    tl.to(this.camera.position, {
      x: target,
      duration: 1.5,
      ease: 'power4.inOut'
    });
    tl.to(this.camera.position, {
      z: 700,
      duration: 1,
      ease: 'power4.inOut'
    }, 0);
    tl.to(this.camera.position, {
      z: 900,
      duration: 1,
      ease: 'power4.inOut'
    }, 1);

    // カーテン効果のエフェクトを動かして元に戻す
    tl.to(this.effectPass.uniforms.uProgress, {
      value: 1,
      duration: 0.8,
      ease: 'power3.inOut'
    }, 0);
    tl.to(this.effectPass.uniforms.uProgress, {
      value: 0,
      duration: 0.8,
      ease: 'power3.inOut'
    }, 1);

    // RGB効果のエフェクトを動かして元に戻す
    tl.to(this.effectPass2.uniforms.uProgress, {
      value: 1,
      duration: 0.5,
      ease: 'power3.inOut'
    }, 0);
    tl.to(this.effectPass2.uniforms.uProgress, {
      value: 0,
      duration: 0.5,
      ease: 'power3.inOut'
    }, 1);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    // 画像を読み込む
    this.textures = [t1, t2, t3];
    this.textures = this.textures.map(t => new THREE.TextureLoader().load(t));
    this.maskTexture = new THREE.TextureLoader().load(mask);

    // マテリアルのテクスチャに画像を反映して、プレーンにはりつける　
    // this.material = new THREE.MeshBasicMaterial({ map: this.textures[0] });
    // this.geometry = new THREE.PlaneGeometry(1920, 1080, 1, 1);
    // this.plane = new THREE.Mesh(this.geometry, this.material);
    // this.scene.add(this.plane);

    // 複数画像を用意する時はこんなかんじ
    this.groups = [];

    this.geometry = new THREE.PlaneGeometry(1920, 1080, 1, 1);

    this.textures.forEach((t, j) => {
      let group = new THREE.Group();
      this.scene.add(group);
      this.groups.push(group);

      // 3つの画像を重ねる(数を変えると面白い感じになる)
      for (let i = 0; i < 3; i++) {
        let materialOpstion = {
          map: t,
        }
        // 最初のやつ以外はマスクして透けるようにする
        if (i > 0) {
          materialOpstion.alphaMap = this.maskTexture
          materialOpstion.transparent = true
        }
        let material = new THREE.MeshBasicMaterial(materialOpstion);
        let mesh = new THREE.Mesh(this.geometry, material);
        // 重ねる画像は徐々に手間に配置する
        mesh.position.z = (i * 1) * 100;
        group.add(mesh);
        group.position.x = j * 2500;
      }
    })


  }

  addLights() {
    const light1 = new THREE.AmbientLight(0xeeeeee, 0.5);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5);
    light2.position.set(0.5, 0, 0.866);
    this.scene.add(light2);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    this.oscilaltor = Math.sin(this.time * 0.1) * 0.5 + 0.5;

    this.mouseTarget.lerp(this.mouse, 0.1)

    this.groups.forEach(g => {
      g.rotation.x = -this.mouseTarget.y * 0.3;
      g.rotation.y = -this.mouseTarget.x * 0.3;

      g.children.forEach((m, i) => {
        m.position.z = (i + 1) * 100 - this.oscilaltor * 200;
      })
    })

    // this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}

new Sketch({
  dom: document.getElementById('container'),
});