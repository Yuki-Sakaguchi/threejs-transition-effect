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
    this.time = 0;
    this.mouse = new THREE.Vector2();
    this.mouseTarget = new THREE.Vector2();

    this.isPlaying = true;

    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.events();
    // this.initSettings();

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

  events() {
    this.event.on('move', ({ uv }) => {
      this.mouse.x = uv[0] - 0.5;
      this.mouse.y = uv[1] - 0.5;
      console.log(this.mouse)
    });
  }

  initSettings() {
    this.settings = {
      progress: 0,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    // this.material = new THREE.ShaderMaterial({
    //   extensions: {
    //     derivatives: "#extension GL_OES_standard_derivativers : enable",
    //   },
    //   side: THREE.DoubleSide,
    //   uniforms: {
    //     time: { value: 0 },
    //     resolution: { value: new THREE.Vector4() },
    //   },
    //   // wireframe: true,
    //   // transparent: true,
    //   vertexShader: vertex,
    //   fragmentShader: fragment,
    // });

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
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.geometry = new THREE.PlaneGeometry(1920, 1080, 1, 1);

    // 3つの画像を重ねる
    for (let i = 0; i < 3; i++) {
      let materialOpstion = {
        map: this.textures[0],
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
      this.group.add(mesh);
    }
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

    this.mouseTarget.lerp(this.mouse, 0.1);

    this.group.rotation.x = -this.mouseTarget.y * 0.3;
    this.group.rotation.y = -this.mouseTarget.x * 0.3;

    // this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById('container'),
});