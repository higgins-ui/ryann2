import * as THREE from 'three';
import { QUALITY, PARTICLE_RANGES } from './config.js';
import { isMobileDevice, isWebGLAvailable, randomInt, fallbackTex, setAudioSources } from './utils.js';
import { getSettings } from './settings.js';
import { World } from './environment.js';
import { Timeline } from './sequence.js';

class Galaxy {
  constructor(settings) {
    this.settings = settings;
    this.texts = settings.texts;

    this.isMobileDevice = isMobileDevice();
    // En la laptop va fluido (laptop gama baja generalmente la mayoria de las personas tiene  laptops con mas recursos asi q funcionara bien en casi todos los casos ) pero en el telefono para no forzar la grafica Si el movil es gama baja le reducimos la cantidad de
    // particulas y el pixel ratio para que no se asfixie el renderizado.
    this.qualityMultiplier = this.isMobileDevice ? QUALITY.mobileMultiplier : 1.0;

    this.state = {
      isCameraZoomed: false,
      isApplicationActive: false,
      isSequenceComplete: false,
      loadedMediaCount: 0,
      totalMediaCount: 0,
      primaryMediaObjs: [],
      secondaryMediaObjs: []
    };

    this.specialMemories = settings.photos.special;
    this.galleryPhotos = settings.photos.gallery;

    this.DOM = {
      canvasContainer: document.getElementById('canvas-container'),
      loadingOverlay: document.getElementById('loading-overlay'),
      loaderFill: document.getElementById('loader-fill'),
      loaderMessage: document.querySelector('.loader-message'),
      startBtnContainer: document.getElementById('start-btn-container'),
      startBtn: document.getElementById('start-btn'),
      errorOverlay: document.getElementById('error-overlay'),
      textOverlay: document.getElementById('text-overlay'),
      textTitle: document.getElementById('text-title'),
      textSub: document.getElementById('text-sub'),
      photoText: document.getElementById('photo-text'),
      photoTextContent: document.getElementById('photo-text-content'),
      photoIndex: document.getElementById('photo-index'),
      vignetteOverlay: document.getElementById('vignette-overlay'),
      finalTitle: document.getElementById('final-title'),
      endTitle: document.getElementById('end-title'),
      ambientAudio: document.getElementById('ambient-audio'),
      eventAudio: document.getElementById('event-audio')
    };

    this.clock = new THREE.Clock();
    this.textureLoader = new THREE.TextureLoader();
    this.sharedSphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);

    this.setUI();
    this.applyAudio();
    this.sparkles();
    this.init();
  }

  setUI() {
    const t = this.texts;
    if (this.DOM.loaderMessage) this.DOM.loaderMessage.textContent = t.loaderLoading;

    const startText = this.DOM.startBtn && this.DOM.startBtn.querySelector('.text');
    if (startText) startText.textContent = t.startButton;

    const finalH = this.DOM.finalTitle && this.DOM.finalTitle.querySelector('h1');
    if (finalH) finalH.textContent = t.finalTitle;
    const finalSub = this.DOM.finalTitle && this.DOM.finalTitle.querySelector('.sub');
    if (finalSub) finalSub.textContent = t.finalSubtitle;

    const endH = this.DOM.endTitle && this.DOM.endTitle.querySelector('h1');
    if (endH) endH.textContent = t.endTitle;

    const errP = this.DOM.errorOverlay && this.DOM.errorOverlay.querySelector('p');
    if (errP) errP.textContent = t.webglFallback;
  }

  applyAudio() {
    setAudioSources(this.DOM.ambientAudio, this.settings.audio.ambient);
    setAudioSources(this.DOM.eventAudio, this.settings.audio.event);
  }

  sparkles() {
    const particles = document.querySelectorAll('.btn-wrap .star');
    particles.forEach(p => {
      p.setAttribute('style', `
        --angle: ${randomInt(...PARTICLE_RANGES.angle)};
        --duration: ${randomInt(...PARTICLE_RANGES.duration)};
        --delay: ${randomInt(...PARTICLE_RANGES.delay)};
        --alpha: ${randomInt(...PARTICLE_RANGES.alpha) / 100};
        --size: ${randomInt(...PARTICLE_RANGES.size)};
        --distance: ${randomInt(...PARTICLE_RANGES.distance)};
      `);
    });
  }

  showError(msg) {
    if (this.DOM.errorOverlay) this.DOM.errorOverlay.hidden = false;
    if (this.DOM.loadingOverlay) this.DOM.loadingOverlay.style.display = 'none';
    throw new Error(msg || 'WebGL init failed');
  }

  init() {
    if (!isWebGLAvailable()) this.showError();

    this.state.totalMediaCount = this.specialMemories.length + this.galleryPhotos.length;

    this.environment = new World(this.DOM.canvasContainer, this.isMobileDevice, this.qualityMultiplier);
    this.sequence = new Timeline({
      camera: this.environment.camera,
      scene: this.environment.scene,
      mediaGroup: this.environment.groups.media,
      sharedSphereGeometry: this.sharedSphereGeometry,
      DOM: this.DOM,
      state: this.state,
      texts: this.texts
    });

    this.load();
    this.listeners();
    this.loop();
  }

  load() {
    const handleLoad = (tex, item, i, list, isPrimary) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      const obj = this.environment.addPhoto(tex, i, list.length, isPrimary);
      obj.data = item;
      (isPrimary ? this.state.primaryMediaObjs : this.state.secondaryMediaObjs).push(obj);
      this.state.loadedMediaCount++;
      this.DOM.loaderFill.style.width = (this.state.loadedMediaCount / this.state.totalMediaCount) * 100 + '%';

      if (this.state.loadedMediaCount >= this.state.totalMediaCount) {
        this.DOM.startBtnContainer.style.display = 'block';
        setTimeout(() => {
          this.DOM.startBtnContainer.classList.add('is-ready');
        }, 50);
        document.querySelector('.loader-indicator').style.display = 'none';
        if (this.DOM.loaderMessage) this.DOM.loaderMessage.textContent = this.texts.loaderReady;
      }
    };

    this.specialMemories.forEach((item, i) => this.textureLoader.load(item.path, t => handleLoad(t, item, i, this.specialMemories, true), undefined, () => handleLoad(fallbackTex(THREE), item, i, this.specialMemories, true)));
    this.galleryPhotos.forEach((item, i) => this.textureLoader.load(item.path, t => handleLoad(t, item, i, this.galleryPhotos, false), undefined, () => handleLoad(fallbackTex(THREE), item, i, this.galleryPhotos, false)));
  }

  listeners() {
    this.DOM.startBtn.addEventListener('click', () => {
      this.state.isApplicationActive = true;

      this.DOM.ambientAudio.volume = 0.7;
      this.DOM.ambientAudio.play().catch(e => console.warn(e));

      this.DOM.startBtnContainer.style.display = 'none';
      gsap.to(this.DOM.loadingOverlay, { opacity: 0, duration: 1.2, onComplete: () => {
        this.DOM.loadingOverlay.style.display = 'none';
        this.DOM.vignetteOverlay.style.opacity = '1';
        this.sequence.run();
      }});
    });

    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;

    window.addEventListener('resize', () => {
      // En telefonos o tablets cada toque o cuando la barra de direcciones del navegador se esconde sola salta un resize  Sin este filtro threejs recalcula la camara y el canvas a cada momento de forma innecesaria.
      if (Math.abs(window.innerWidth - lastWidth) < 10 && Math.abs(window.innerHeight - lastHeight) < 50) {
        return;
      }

      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
      this.environment.resize();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.DOM.ambientAudio.pause();
        this.DOM.eventAudio.pause();
      } else if (this.state.isApplicationActive) {
        if (this.state.isSequenceComplete) {
          this.DOM.eventAudio.play().catch(()=>{});
        } else {
          this.DOM.ambientAudio.play().catch(()=>{});
        }
      }
    });
  }
// Si la pestaña no esta visible congelamos el renderizado entero  consume la bateria y recursos  La musica tambien se pausa abajo.
  loop() {
    requestAnimationFrame(() => this.loop());
    
    
   
    if (document.hidden) return;

    const dt = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    this.environment.tick(dt, t, this.state);
    this.environment.render();
  }
}

const settings = await getSettings();
new Galaxy(settings);
