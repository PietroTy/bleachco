import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ps1, ps1Uniforms, pixelTexture, noiseCanvas } from './ps1';

const ORANGE = '#D4521E';

// Estampas em 64px (mesmo motivo do SVG do site; desenhadas direto no canvas pra não
// depender de carregar SVG em textura, que alguns navegadores bloqueiam)
const PRINTS = {
  eclipse: {
    name: 'ECLIPSE',
    draw(ctx, cx, cy, r) {
      ctx.fillStyle = 'rgba(212,82,30,0.25)';
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ORANGE;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0c0c0c';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.66, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ORANGE;
      [[-0.95, -0.6, 2], [0.9, 0.55, 1.5], [-0.5, 0.95, 1]].forEach(([dx, dy, s]) => ctx.fillRect(cx + dx * r, cy + dy * r, s, s));
    },
  },
  spy: {
    name: 'SPY',
    draw(ctx, cx, cy, r) {
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.1, r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = ORANGE;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#080808';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ORANGE;
      for (let k = -2; k <= 2; k++) ctx.fillRect(cx + k * r * 0.4, cy - r * 0.95 - Math.abs(k), 1, 3);
    },
  },
};
const PRINT_IDS = Object.keys(PRINTS);

function shirtTexture(printId) {
  const c = noiseCanvas(128, 128, [20, 20, 20], 14, 11);
  const ctx = c.getContext('2d');
  // Frente da camiseta fica no meio da textura (u = 0.5); peito em ~35% do topo.
  // A textura dá a volta no tronco e estica ~2.6x na horizontal: desenha comprimido.
  ctx.save();
  ctx.translate(64, 46);
  ctx.scale(1 / 2.6, 1);
  PRINTS[printId].draw(ctx, 0, 0, 15);
  ctx.restore();
  // Respingos soltos de alvejante pelo tecido
  ctx.fillStyle = 'rgba(212,82,30,0.55)';
  [[40, 70], [88, 30], [70, 92], [20, 50], [104, 80]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
  return pixelTexture(c);
}

function boneTexture() {
  const c = noiseCanvas(32, 32, [196, 186, 160], 46, 3);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(40,30,20,0.35)';
  for (let x = 0; x < 32; x += 5) ctx.fillRect(x, 0, 1, 32); // sujeira escorrida
  return pixelTexture(c);
}

function bottleTexture() {
  const c = noiseCanvas(32, 32, [226, 222, 214], 18, 5);
  const ctx = c.getContext('2d');
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, 12, 32, 9);
  ctx.fillStyle = '#080808';
  ctx.fillRect(6, 15, 20, 1);
  ctx.fillRect(6, 18, 14, 1);
  return pixelTexture(c);
}

// Cilindro de osso ligando dois pontos
function limb(material, a, b, r, sides = 5) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, dir.length(), sides), material);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

function buildScene(printId) {
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const bone = ps1(new THREE.MeshLambertMaterial({ map: boneTexture(), flatShading: true }));
  const dark = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const cloth = ps1(new THREE.MeshLambertMaterial({ map: shirtTexture(printId), flatShading: true, side: THREE.DoubleSide }));
  const ember = new THREE.MeshBasicMaterial({ color: 0xff6a1a });

  const body = new THREE.Group();

  // Camiseta: tronco achatado + mangas + gola
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.88, 10, 2, false, -Math.PI, Math.PI * 2), cloth);
  torso.position.y = 0.44;
  torso.scale.z = 0.62;
  body.add(torso);
  for (const side of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.3, 7, 1, true), cloth);
    sleeve.position.set(side * 0.42, 0.74, 0);
    sleeve.rotation.z = side * 0.75;
    body.add(sleeve);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.026, 3, 8), cloth);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.88;
  body.add(collar);

  // Pescoço (vértebras) e crânio
  for (let k = 0; k < 3; k++) {
    const vert = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.07), bone);
    vert.position.set(0, 0.91 + k * 0.06, -0.02);
    body.add(vert);
  }
  const head = new THREE.Group();
  head.position.set(0, 1.06, 0);
  head.scale.setScalar(1.18);
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), bone);
  skull.scale.set(0.88, 1, 1.05);
  skull.position.y = 0.17;
  head.add(skull);
  for (const side of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.IcosahedronGeometry(0.052, 0), dark);
    socket.position.set(side * 0.075, 0.17, 0.165);
    head.add(socket);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.01), ember);
    glow.position.set(side * 0.075, 0.165, 0.2);
    head.add(glow);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 3), dark);
  nose.position.set(0, 0.1, 0.19);
  nose.rotation.x = Math.PI;
  head.add(nose);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.17), bone);
  jaw.position.set(0, 0.0, 0.05);
  head.add(jaw);
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.02), bone);
  teeth.position.set(0, 0.045, 0.14);
  head.add(teeth);
  body.add(head);

  // Braços saindo das mangas
  const shoulderL = v(-0.48, 0.66, 0), elbowL = v(-0.56, 0.32, 0.06), wristL = v(-0.5, 0.04, 0.16);
  const shoulderR = v(0.48, 0.66, 0), elbowR = v(0.6, 0.38, 0.12), wristR = v(0.44, 0.18, 0.36);
  body.add(limb(bone, shoulderL, elbowL, 0.038), limb(bone, elbowL, wristL, 0.03));
  body.add(limb(bone, shoulderR, elbowR, 0.038), limb(bone, elbowR, wristR, 0.03));
  // Juntas
  [elbowL, wristL, elbowR, wristR].forEach((p, k) => {
    const joint = new THREE.Mesh(new THREE.IcosahedronGeometry(k % 2 ? 0.035 : 0.048, 0), bone);
    joint.position.copy(p);
    body.add(joint);
  });
  for (let f = 0; f < 4; f++) {
    body.add(limb(bone, wristL, v(-0.52 + f * 0.02, -0.06, 0.16 + f * 0.022), 0.011, 3));
  }

  // Garrafa de alvejante na mão direita, inclinada, pingando
  const bottle = new THREE.Group();
  const bottleMat = ps1(new THREE.MeshLambertMaterial({ map: bottleTexture(), flatShading: true }));
  const jug = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.24, 0.1), bottleMat);
  bottle.add(jug);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6), ps1(new THREE.MeshLambertMaterial({ color: 0xd4521e })));
  cap.position.set(0.04, 0.14, 0);
  bottle.add(cap);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.013, 3, 6, Math.PI), bottleMat);
  handle.position.set(-0.03, 0.12, 0);
  bottle.add(handle);
  bottle.position.copy(wristR).add(v(0.06, 0.02, 0.05));
  bottle.rotation.z = -1.15;
  body.add(bottle);
  for (let f = 0; f < 3; f++) {
    body.add(limb(bone, wristR, v(0.5 + f * 0.012, 0.1 - f * 0.03, 0.42), 0.011, 3));
  }

  // Gotas caindo da tampa
  const drips = [];
  const dripGeo = new THREE.BoxGeometry(0.014, 0.03, 0.014);
  for (let k = 0; k < 6; k++) {
    const d = new THREE.Mesh(dripGeo, ember);
    d.userData.t = k / 6;
    drips.push(d);
    body.add(d);
  }
  const spout = new THREE.Vector3();

  body.rotation.x = 0.1; // curvado, cansado
  return { body, head, jaw, torso, cap, drips, spout, cloth };
}

// Esqueleto low-poly estilo Demon's Souls vestindo a camiseta, renderizado como PS1
// print: estampa inicial (ou fixa, com cycle=false); cycle: clique troca a estampa
export default function Skeleton3D({ fallback, print = PRINT_IDS[0], cycle = true }) {
  const wrapRef = useRef(null);
  const apiRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [printId, setPrintId] = useState(PRINTS[print] ? print : PRINT_IDS[0]);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return undefined;
    }
    const canvas = renderer.domElement;
    canvas.className = 'skeleton3d-canvas';
    wrap.prepend(canvas);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x080808, 3.2, 6.5);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
    camera.position.set(0, 0.95, 3.6);
    camera.lookAt(0, 0.6, 0);

    scene.add(new THREE.AmbientLight(0x5a5650, 1.5));
    const key = new THREE.DirectionalLight(0xe8e0d0, 1.1);
    key.position.set(-0.8, 1.6, 2.2);
    scene.add(key);
    const torch = new THREE.PointLight(0xff6a1a, 3.2, 0, 1.6);
    torch.position.set(1.6, 0.9, 0.6);
    scene.add(torch);
    const rim = new THREE.DirectionalLight(0x8fa6dc, 2.2);
    rim.position.set(-1.6, 1.8, -2.2);
    scene.add(rim);

    const parts = buildScene(printId);
    const pivot = new THREE.Group();
    pivot.add(parts.body);
    scene.add(pivot);

    // Resolução baixa de propósito: ~1/3 do tamanho na tela
    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const scale = w < 500 ? 2.5 : 3;
      const iw = Math.max(80, Math.round(w / scale));
      const ih = Math.max(80, Math.round(h / scale));
      renderer.setSize(iw, ih, false);
      camera.aspect = iw / ih;
      camera.updateProjectionMatrix();
      ps1Uniforms.uSnap.value.set(iw / 2.5, ih / 2.5);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rotY = -0.35;
    let velocity = reduced ? 0 : 0.0025;
    let dragging = null;
    let visible = true;
    let raf = 0;
    const t0 = performance.now();

    const frame = () => {
      const t = (performance.now() - t0) / 1000;
      if (!dragging) {
        rotY += velocity;
        velocity += ((reduced ? 0 : 0.0025) - velocity) * 0.02; // volta pro giro lento
      }
      pivot.rotation.y = rotY;
      parts.torso.scale.y = 1 + Math.sin(t * 1.5) * 0.012;
      parts.head.rotation.x = 0.2 + Math.sin(t * 0.7) * 0.04;
      parts.head.rotation.z = Math.sin(t * 0.4) * 0.07;
      parts.jaw.rotation.x = Math.max(0, Math.sin(t * 0.9)) * 0.12;
      torch.intensity = 3.2 * (0.8 + 0.14 * Math.sin(t * 13) + 0.06 * Math.sin(t * 31));

      parts.cap.getWorldPosition(parts.spout);
      parts.body.worldToLocal(parts.spout);
      parts.drips.forEach((d) => {
        d.userData.t = (d.userData.t + 0.012) % 1;
        const p = d.userData.t;
        d.position.set(parts.spout.x + 0.01, parts.spout.y - p * p * 1.4, parts.spout.z);
        d.visible = p > 0.02;
      });

      renderer.render(scene, camera);
      if (visible) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    });
    io.observe(wrap);

    const onDown = (e) => {
      dragging = { x: e.clientX, moved: 0, last: e.clientX };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragging.last;
      dragging.last = e.clientX;
      dragging.moved += Math.abs(dx);
      rotY += dx * 0.01;
      velocity = dx * 0.01;
    };
    const onUp = () => {
      if (dragging && dragging.moved < 6) apiRef.current?.next();
      dragging = null;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    apiRef.current = {
      setPrint(id) {
        parts.cloth.map.dispose();
        parts.cloth.map = shirtTexture(id);
        parts.cloth.needsUpdate = true;
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { o.material.map?.dispose(); o.material.dispose(); }
      });
      renderer.dispose();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estampa definida por fora (ex: página de produto trocando de eclipse pra spy)
  useEffect(() => {
    if (PRINTS[print] && apiRef.current) {
      apiRef.current.setPrint(print);
      setPrintId(print);
    }
  }, [print]);

  // Troca de estampa com um "tracking" de VHS rapidinho
  useEffect(() => {
    if (!apiRef.current) return;
    apiRef.current.next = () => {
      if (!cycle) return;
      setGlitch(true);
      setTimeout(() => {
        setPrintId((cur) => {
          const nxt = PRINT_IDS[(PRINT_IDS.indexOf(cur) + 1) % PRINT_IDS.length];
          apiRef.current.setPrint(nxt);
          return nxt;
        });
      }, 120);
      setTimeout(() => setGlitch(false), 320);
    };
  });

  if (failed) return fallback || null;

  return (
    <div ref={wrapRef} className={`skeleton3d${glitch ? ' is-glitching' : ''}`}>
      <span className="skeleton3d-osd">▶ {PRINTS[printId].name}</span>
      <span className="skeleton3d-osd skeleton3d-osd--hint">{cycle ? 'arrasta · clica' : 'arrasta'}</span>
    </div>
  );
}
