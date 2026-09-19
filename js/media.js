import * as THREE from 'three';

export function makePhoto(group, tex, i, total, primary) {
  let x, y, z;
  if (primary) {
    x = i === 0 ? -2.5 : 2.5;
    y = 0;
    z = 14;
  } else {
    // Las fotos de la galeria las reparto en una especie de espiral alrededor del centro (angulo y radio van creciendo con el indice) Asi no se  montan unas encima de otras y el viaje orbital da la vuelta a todas.
    const t = (i + 1) / total;
    const a = t * Math.PI * 5 + 1;
    const r = 9 + t * 12;
    x = Math.cos(a) * r;
    z = Math.sin(a) * r;
    y = (Math.random() - 0.5) * 5;
  }

  const asp = tex.image ? (tex.image.width / tex.image.height) : 16 / 9;
  const w = primary ? 4.0 : 3.0;
  const h = w / asp;

  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.lookAt(0, primary ? 0 : y * 0.3, 0);

  const border = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }));
  mesh.add(border);
  group.add(mesh);

  return { mesh, originalPosition: mesh.position.clone(), originalRotation: mesh.quaternion.clone() };
}
