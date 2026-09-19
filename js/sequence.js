import * as THREE from 'three';
import { COLORS } from './config.js';

export class Timeline {
  constructor({ camera, scene, mediaGroup, sharedSphereGeometry, DOM, state, texts }) {
    this.camera = camera;
    this.scene = scene;
    this.mediaGroup = mediaGroup;
    this.sharedSphereGeometry = sharedSphereGeometry;
    this.DOM = DOM;
    this.state = state;
    this.texts = texts;
  }

  intro() {
    return new Promise(res => {
      this.camera.position.set(0, 50, 400);
      gsap.to(this.camera, { fov: 100, duration: 2.5, yoyo: true, repeat: 1, ease: "power2.inOut", onUpdate: () => this.camera.updateProjectionMatrix() });
      gsap.to(this.camera.position, { y: 6, z: 40, duration: 5, ease: "power3.inOut", onUpdate: () => this.camera.lookAt(0,0,0), onComplete: res });
    });
  }

  flyTo(target, duration) {
    return new Promise(res => {
      this.state.isCameraZoomed = true;
      const wPos = new THREE.Vector3();
      target.mesh.getWorldPosition(wPos);
      const normal = new THREE.Vector3(0,0,1).applyQuaternion(target.mesh.getWorldQuaternion(new THREE.Quaternion()));
      const finalPos = wPos.clone().add(normal.multiplyScalar(4.5));

      const initLook = new THREE.Vector3();
      this.camera.getWorldDirection(initLook);
      initLook.multiplyScalar(10).add(this.camera.position);

      gsap.to(this.camera.position, { x: finalPos.x, y: finalPos.y, z: finalPos.z, duration: duration/1000, ease: "power3.inOut" });
      gsap.to(initLook, { x: wPos.x, y: wPos.y, z: wPos.z, duration: duration/1000, ease: "power3.inOut", onUpdate: () => this.camera.lookAt(initLook), onComplete: res });
    });
  }

  resetCam(duration) {
    return new Promise(res => {
      const initLook = new THREE.Vector3();
      this.camera.getWorldDirection(initLook);
      initLook.multiplyScalar(10).add(this.camera.position);
      gsap.to(this.camera.position, { x: 0, y: 6, z: 40, duration: duration/1000, ease: "power3.inOut" });
      gsap.to(initLook, { x: 0, y: 0, z: 0, duration: duration/1000, ease: "power3.inOut", onUpdate: () => this.camera.lookAt(initLook), onComplete: () => {
        this.state.isCameraZoomed = false;
        res();
      } });
    });
  }

  orbit(center, radius, height, duration) {
    return new Promise(res => {
      const startAngle = Math.atan2(this.camera.position.z - center.z, this.camera.position.x - center.x);
      const proxy = { angle: startAngle, t: 0 };
      gsap.to(proxy, { angle: startAngle + Math.PI*2, t: 1, duration: duration/1000, ease: "sine.inOut", onUpdate: () => {
        this.camera.position.set(center.x + Math.cos(proxy.angle)*radius, height + Math.sin(proxy.t*Math.PI*2)*2, center.z + Math.sin(proxy.angle)*radius);
        this.camera.lookAt(center);
      }, onComplete: res });
    });
  }

  showText(title, sub, delay) {
    return new Promise(res => {
      this.DOM.textTitle.textContent = title;
      this.DOM.textSub.textContent = sub;
      const tl = gsap.timeline({ onComplete: res });
      tl.to(this.DOM.textOverlay, { opacity: 1, duration: 1.5 })
        .to(this.DOM.textOverlay, { opacity: 0, duration: 1.2 }, `+=${delay / 1000}`)
        .to({}, { duration: 1.2 });
    });
  }

  showCaption(caption, index, total) {
    return new Promise(res => {
      this.DOM.photoIndex.textContent = `${this.texts.photoIndex} ${index} · ${total}`;
      this.DOM.photoTextContent.textContent = caption;
      gsap.fromTo(this.DOM.photoText, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", onComplete: () => {
        gsap.to(this.DOM.photoText, { y: -20, opacity: 0, duration: 0.8, delay: 3.5, onComplete: res });
      }});
    });
  }

  async run() {
    await this.intro();
    await this.showText(this.texts.introTitle, this.texts.introSubtitle, 3500);

    await this.flyTo(this.state.primaryMediaObjs[0], 3000);
    await this.showText(this.texts.milestoneTitle, this.texts.milestoneSubtitle, 6000);
    await this.resetCam(2000);

    await this.flyTo(this.state.primaryMediaObjs[1], 3000);
    await this.showText(this.texts.turningPointTitle, this.texts.turningPointSubtitle, 5000);
    await this.resetCam(2000);

    await this.showText(this.texts.revealTitle, this.texts.revealSubtitle, 3500);
    await this.orbit(new THREE.Vector3(0,0,0), 30, 12, 8000);

    for (let i = 0; i < this.state.secondaryMediaObjs.length; i++) {
      const item = this.state.secondaryMediaObjs[i];
      await this.flyTo(item, 2500);
      await this.showCaption(item.data.caption, i+1, this.state.secondaryMediaObjs.length);
      await new Promise(r => setTimeout(r, 1000));
      await this.resetCam(2000);
    }

    await this.orbit(new THREE.Vector3(0,0,0), 25, 10, 6000);
    await this.finale();
  }

  finale() {
    return new Promise(res => {
      this.state.isSequenceComplete = true;
      const allMedia = [...this.state.primaryMediaObjs, ...this.state.secondaryMediaObjs];
      gsap.to(this.camera.position, { x:0, y:10, z:50, duration: 3, ease: "power3.inOut", onUpdate: ()=>this.camera.lookAt(0,0,0), onComplete: () => {
        this.toDots(allMedia).then(() => this.crashIn(allMedia)).then(() => {
          this.DOM.ambientAudio.pause();
          this.DOM.eventAudio.volume = 0.8;
          this.DOM.eventAudio.play().catch(()=>{});
          this.flash();
          gsap.fromTo(this.DOM.finalTitle, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 2, ease: "back.out(1.7)" });
          setTimeout(res, 5000);
        });
      }});
    });
  }

  toDots(mediaList) {
    return new Promise(res => {
      let done = 0;
      mediaList.forEach((media, i) => {
        gsap.delayedCall(i * 0.35, () => {
          gsap.to(media.mesh.scale, { x:0.1, y:0.1, duration: 1.2, ease: "power3.in" });
          if(media.mesh.material) gsap.to(media.mesh.material, { opacity: 0, duration: 1.2, onComplete: () => {
            const pos = media.mesh.position.clone();

            if (media.mesh.geometry) media.mesh.geometry.dispose();
            if (media.mesh.material) media.mesh.material.dispose();

            // WebGL no libera la vram solo el recolector de basura  de js no toca  las texturas, si no llamamos a dispose cada foto descargada se queda congelada en la memoria de la grafica hasta que la pestaña colapsa por memory leak, Por eso limpio antes de convertirla en particula 
            

            this.mediaGroup.remove(media.mesh);
            const color = COLORS.explosion[i % COLORS.explosion.length];
            media.color = color;

            const sphere = new THREE.Mesh(this.sharedSphereGeometry, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5 }));
            sphere.position.copy(pos);
            this.mediaGroup.add(sphere);

            media.mesh = sphere;
            media.originalPosition = pos.clone();
            done++;
            if(done >= mediaList.length) res();
          }});
        });
      });
    });
  }

  crashIn(mediaList) {
    return new Promise(res => {
      gsap.to(this.mediaGroup.rotation, { y: "+=1.5", x: "+=0.5", duration: 4, ease: "power2.inOut" });
      const proxy = { t: 0 };
      const currentPos = new THREE.Vector3();
      gsap.to(proxy, { t: 1, duration: 2.5, delay: 1.5, ease: "power3.in", onUpdate: () => {
        mediaList.forEach(m => {
          currentPos.lerpVectors(m.originalPosition, new THREE.Vector3(0,0,0), Math.pow(proxy.t, 3));
          currentPos.add(new THREE.Vector3(m.originalPosition.z, m.originalPosition.y, -m.originalPosition.x).normalize().multiplyScalar(Math.sin(proxy.t*Math.PI)*12));
          m.mesh.position.copy(currentPos);
          if (proxy.t > 0.9 && m.mesh.material.emissive) m.mesh.material.emissive.setHex(0xffffff);
        });
      }, onComplete: res });
    });
  }

  flash() {
    const geo = new THREE.SphereGeometry(1, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
    const flash = new THREE.Mesh(geo, mat);
    this.scene.add(flash);

    gsap.to(flash.scale, { x: 50, y: 50, z: 50, duration: 1.5, ease: "power2.out" });
    gsap.to(mat, { opacity: 0, duration: 1.5, ease: "power2.out", onComplete: () => {
      // Esta esfera solo existe 1.5 segundos para el estallido del final es Un objeto temporal no se queda  en la escena ni en la
      // memoria grafica asi se destruye al terminar
      this.scene.remove(flash);
      geo.dispose();
      mat.dispose();
    }});
  }
}
