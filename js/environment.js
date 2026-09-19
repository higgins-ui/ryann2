import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { COLORS } from './config.js';
import { flareTex } from './utils.js';
import { makePhoto } from './media.js';

export class World {
  constructor(container, isMobile, qualityMultiplier) {
    this.isMobile = isMobile;
    this.qualityMultiplier = qualityMultiplier;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020005);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 100, 600);

    this.groups = {
      media: new THREE.Group(),
      brightStars: null,
      primaryStarfield: null,
      nebula: null,
      dust: null,
      orbitalLights: []
    };

    this.initRenderer(container);
    this.addLights();
    this.initStars();
    this.scene.add(this.groups.media);
  }

  initRenderer(container) {
    // Forzamos el pixel ratio a 1.0 en moviles y apagamos el antialias
   
   

    // En la laptop con su grafica dedicada va bien  con antialias.

    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.0 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    if (!this.isMobile) {
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.2, 0.95);
      this.composer.addPass(bloomPass);

      const fxaaPass = new ShaderPass(FXAAShader);
      const dpr = this.renderer.getPixelRatio();
      fxaaPass.material.uniforms['resolution'].value.set(1 / (window.innerWidth * dpr), 1 / (window.innerHeight * dpr));
      this.composer.addPass(fxaaPass);
    }
  }

  addLights() {
    this.scene.add(new THREE.AmbientLight(0x220044, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 5);
    this.scene.add(dirLight);

    COLORS.orbital.forEach((color, i) => {
      const light = new THREE.PointLight(new THREE.Color(color), 1.2, 30);
      this.scene.add(light);
      this.groups.orbitalLights.push({ light, angle: (i / 6) * Math.PI * 2, radius: 15 + i * 2, speed: 0.2 + i * 0.1, yOffset: (i - 2.5) * 3 });
    });
  }

  initStars() {
    const flare = flareTex(THREE);

    this.groups.primaryStarfield = new THREE.Group();
    // La cantidad de estrellas la escalo con el qualityMultiplier asi en el  telefono bajamos de 8000 a como 2400 y no se traba la tarjeta grafica (ojo esto fue testeado en un tlf basico del 2026 un tecno spark 10)
    const bgCount = Math.floor(8000 * this.qualityMultiplier);
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3);
    const bgCol = new Float32Array(bgCount * 3);

    for (let i = 0; i < bgCount; i++) {
      const r = 150 + Math.random() * 800;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      bgPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      bgPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      bgPos[i * 3 + 2] = r * Math.cos(ph);

      const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.2 + Math.random() * 0.3, 0.7 + Math.random() * 0.3);
      c.toArray(bgCol, i * 3);
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));
    this.groups.primaryStarfield.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
      size: 0.3, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
    })));

    const brCount = Math.floor(1000 * this.qualityMultiplier);
    const brGeo = new THREE.BufferGeometry();
    const brPos = new Float32Array(brCount * 3);
    const brSize = new Float32Array(brCount);

    for (let i = 0; i < brCount; i++) {
      const r = 50 + Math.random() * 600;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      brPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      brPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      brPos[i * 3 + 2] = r * Math.cos(ph);
      brSize[i] = 1.0 + Math.random() * 3.0;
    }
    brGeo.setAttribute('position', new THREE.BufferAttribute(brPos, 3));
    brGeo.setAttribute('size', new THREE.BufferAttribute(brSize, 1));

    // Este shader mueve el titileo de las estrellas en la GPU no en Javascrip Si recorriera las 1000 estrellas con un for para cambiar su opacidaden cada frame llenaria el hilo principal y GSAP se trabaria
    // Le paso la formula al vertex shader con un uniform time y la cpu queda libre
    const brMat = new THREE.ShaderMaterial({
      uniforms: { pointTexture: { value: flare }, time: { value: 0 }, color: { value: new THREE.Color(0xffffff) } },
      vertexShader: `attribute float size; varying float vAlpha; uniform float time; void main() { vAlpha = 0.7 + 0.3 * sin(time * 2.0 + position.x); vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (300.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`,
      fragmentShader: `uniform sampler2D pointTexture; uniform vec3 color; varying float vAlpha; void main() { gl_FragColor = vec4(color, vAlpha) * texture2D(pointTexture, gl_PointCoord); if (gl_FragColor.a < 0.1) discard; }`,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
    });
    this.groups.brightStars = new THREE.Points(brGeo, brMat);
    this.groups.primaryStarfield.add(this.groups.brightStars);
    this.scene.add(this.groups.primaryStarfield);
  }

  addPhoto(tex, index, total, isPrimary) {
    return makePhoto(this.groups.media, tex, index, total, isPrimary);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  tick(dt, t, state) {
    if (this.groups.brightStars) this.groups.brightStars.material.uniforms.time.value = t;
    if (this.groups.primaryStarfield) {
      this.groups.primaryStarfield.rotation.y += dt * 0.01;
      this.groups.primaryStarfield.rotation.x += dt * 0.005;
    }

    if (!state.isCameraZoomed) this.groups.media.rotation.y += dt * 0.04;

    this.groups.orbitalLights.forEach(l => {
      l.angle += dt * l.speed;
      l.light.position.set(Math.cos(l.angle) * l.radius, l.yOffset + Math.sin(t * 0.5 + l.angle) * 2, Math.sin(l.angle) * l.radius);
      l.light.intensity = 1.0 + Math.sin(t * 2 + l.angle) * 0.4;
    });
  }

  render() {
    this.composer.render();
  }
}
