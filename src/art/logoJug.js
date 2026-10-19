import * as THREE from 'three';
import { ps1, pixelTexture, noiseCanvas } from './ps1';

// Galão da logo (o "b" de bleach.co), desenhado em px da logo: corpo arredondado, ombro descendo
// até a direita, alça vazada inclinada, etiqueta laranja e tampa canelada em cima à esquerda.
// Origem no centro do furo da alça: é ali que entram os dedos.
export function logoJug() {
  const S = 0.24 / 345; // px da logo → metros
  const HX = 118; const HY = 100; // centro do furo da alça
  const p = (x, y) => new THREE.Vector2((x - HX) * S, (HY - y) * S);
  const body = new THREE.Shape();
  const m = (x, y) => body.moveTo(...p(x, y).toArray());
  const l = (x, y) => body.lineTo(...p(x, y).toArray());
  const q = (cx, cy, x, y) => body.quadraticCurveTo(...p(cx, cy).toArray(), ...p(x, y).toArray());
  m(30, 32); l(92, 32);
  q(150, 60, 168, 140); // ombro
  l(168, 330); q(168, 350, 148, 350);
  l(25, 350); q(5, 350, 5, 330);
  l(5, 85); q(5, 45, 30, 32);
  const hole = new THREE.Path();
  hole.absellipse(...p(118, 100).toArray(), 20 * S, 40 * S, 0, Math.PI * 2, false, -0.6);
  body.holes.push(hole);
  const depth = 0.06;
  const bone = ps1(new THREE.MeshLambertMaterial({ color: 0xece6dc, flatShading: true }));
  const geo = new THREE.ExtrudeGeometry(body, { depth, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 1, curveSegments: 5 });
  geo.translate(0, 0, -depth / 2);
  const jug = new THREE.Group();
  jug.add(new THREE.Mesh(geo, bone));
  // Etiqueta laranja com as linhas pretas, dos dois lados
  const lc = noiseCanvas(32, 40, [212, 82, 30], 16, 3);
  const lctx = lc.getContext('2d');
  lctx.fillStyle = '#080808';
  [[5, 10, 22], [5, 15, 16], [5, 27, 22], [5, 32, 12]].forEach(([x, y, w]) => lctx.fillRect(x, y, w, 2));
  // polygonOffset + afastada da face: senão briga com o corpo (o tremido de vértice do PS1 piora)
  const labelMat = ps1(new THREE.MeshLambertMaterial({ map: pixelTexture(lc), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  const l0 = p(28, 165); const l1 = p(150, 320);
  const labelGeo = new THREE.PlaneGeometry(l1.x - l0.x, l0.y - l1.y);
  [1, -1].forEach((side) => {
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set((l0.x + l1.x) / 2, (l0.y + l1.y) / 2, side * (depth / 2 + 0.011));
    if (side < 0) label.rotation.y = Math.PI;
    jug.add(label);
  });
  // Tampa canelada
  const c = noiseCanvas(16, 8, [240, 234, 224], 8, 9);
  const cctx = c.getContext('2d');
  cctx.fillStyle = '#b9b2a6';
  for (let x = 1; x < 16; x += 4) cctx.fillRect(x, 0, 1, 8);
  const capTex = pixelTexture(c);
  capTex.wrapS = THREE.RepeatWrapping;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(38 * S, 38 * S, 44 * S, 10), ps1(new THREE.MeshLambertMaterial({ map: capTex, emissive: 0x2a2622 })));
  cap.position.copy(new THREE.Vector3(...p(60, 12).toArray(), 0)); // assenta no topo (y 32 da logo)
  jug.add(cap);
  return { jug, cap };
}
