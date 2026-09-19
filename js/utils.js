
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) { return false; }
}

export function fallbackTex(THREE) {
  // Si una foto no carga no vamos a dejar un hueco negro en la escena,
  // pinto un placeholder con la palabra Photo para que se note que falta
  // pero sin romper la experiencia. Tambien sirve de test rapido.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 492);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Photo', 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function flareTex(THREE) {
  // La textura del destello no la descargo de la red se pinta en un canvas invisible de 64x64 en la ram y la paso a CanvasTexture  Asi se ahorra una peticion extra y  no pesa nada en vram Al escalarla dentro del shader se ve perfecta sin archivos externos 
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.4, 'rgba(200,230,255,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function setAudioSources(audioEl, files) {
  if (!audioEl || !files) return;
  audioEl.innerHTML = '';
  const add = (src, type) => {
    const s = document.createElement('source');
    s.src = src;
    s.type = type;
    audioEl.appendChild(s);
  };
  if (files.m4a) add(files.m4a, 'audio/mp4');
  if (files.ogg) add(files.ogg, 'audio/ogg');
  audioEl.load();
}
