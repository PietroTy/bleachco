import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  // Frente da camiseta fica no meio da textura (u = 0.5); peito em ~62% do topo (v segue os pontos do perfil).
  // A textura dá a volta no tronco e estica ~1.55x na horizontal: desenha comprimido.
  ctx.save();
  ctx.translate(64, 79);
  ctx.scale(1 / 1.55, 1);
  PRINTS[printId].draw(ctx, 0, 0, 15);
  ctx.restore();
  // Respingos soltos de alvejante pelo tecido
  ctx.fillStyle = 'rgba(212,82,30,0.55)';
  [[40, 70], [88, 30], [70, 92], [20, 50], [104, 80]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
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

// Modelo: "Low poly retro PSX skeleton" por LonesomeDucky (OpenGameArt, CC-BY 4.0)
const MODEL_URL = `${process.env.PUBLIC_URL}/models/skeleton/skeleton.gltf`;

const _q2 = new THREE.Quaternion();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

// Gira o osso (em coordenadas do mundo) pra que ele aponte do seu início até `target`
function aimBone(bone, child, target) {
  bone.updateWorldMatrix(true, true);
  bone.getWorldPosition(_a);
  child.getWorldPosition(_b);
  const from = _b.sub(_a).normalize();
  const to = target.clone().sub(_a).normalize();
  rotateBoneWorld(bone, _q2.setFromUnitVectors(from, to));
}

function rotateBoneWorld(bone, delta) {
  bone.updateWorldMatrix(true, false);
  const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(parentQ.invert().multiply(delta.clone().multiply(worldQ)));
}

function buildScene(gltf, printId) {
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = gltf.scene;
  const bones = {};
  let skin = null;
  root.traverse((o) => {
    if (o.isBone) bones[o.name.replace('.', '')] = o;
    if (o.isSkinnedMesh) skin = o;
  });

  // Material do modelo trocado por um "de PS1" (luz por vértice, pixel duro, recorte de alfa)
  const map = skin.material.map;
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.generateMipmaps = false;
  skin.material.dispose();
  skin.material = ps1(new THREE.MeshLambertMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide }));
  skin.frustumCulled = false;

  // Pose: braço direito segura o galão pela alça, ao lado do corpo; esquerdo solto
  const P = (b) => b.getWorldPosition(new THREE.Vector3());
  root.updateWorldMatrix(true, true);
  const shR = P(bones.UpperArmR);
  aimBone(bones.UpperArmR, bones.LowerArmR, shR.clone().add(v(-0.085, -0.27, 0.07)));
  const elR = P(bones.LowerArmR);
  aimBone(bones.LowerArmR, bones.HandR, elR.clone().add(v(-0.01, -0.2, 0.14)));
  const shL = P(bones.UpperArmL);
  aimBone(bones.UpperArmL, bones.LowerArmL, shL.clone().add(v(0.075, -0.28, 0.02)));
  const elL = P(bones.LowerArmL);
  aimBone(bones.LowerArmL, bones.HandL, elL.clone().add(v(0.015, -0.24, 0.06)));
  root.updateWorldMatrix(true, true);

  // Camiseta: presa no tronco, cobrindo as costelas
  const cloth = ps1(new THREE.MeshLambertMaterial({ map: shirtTexture(printId), side: THREE.DoubleSide }));
  // Perfil oversized (raio, altura): corpo largo e reto, ombro caído que cobre a cabeça do úmero
  const torso = new THREE.Mesh(
    new THREE.LatheGeometry(
      [v(0.225, -0.3, 0), v(0.215, -0.15, 0), v(0.218, 0.0, 0), v(0.222, 0.12, 0), v(0.222, 0.22, 0), v(0.21, 0.27, 0), v(0.16, 0.305, 0), v(0.08, 0.32, 0)],
      18,
      -Math.PI
    ),
    cloth
  );
  torso.scale.z = 0.86;
  torso.position.set(0, 1.12, -0.04);
  root.add(torso);
  bones.Torso.attach(torso);
  // Mangas acompanham o braço (tecido liso: a estampa é só no peito)
  const plain = ps1(new THREE.MeshLambertMaterial({ map: pixelTexture(noiseCanvas(32, 32, [20, 20, 20], 14, 12)), side: THREE.DoubleSide }));
  for (const side of ['R', 'L']) {
    const sh = P(bones[`UpperArm${side}`]);
    const el = P(bones[`LowerArm${side}`]);
    // Manga abre um pouco pra fora do braço, como tecido caindo do ombro
    const dir = el.clone().sub(sh).normalize().add(v(Math.sign(sh.x) * 0.25, 0, 0)).normalize();
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.2, 12, 1, true), plain);
    // Ombro caído: a manga começa já descendo pelo braço
    sleeve.position.copy(sh).addScaledVector(dir, 0.13);
    sleeve.position.x += Math.sign(sh.x) * 0.035;
    sleeve.position.z -= 0.02;
    sleeve.quaternion.setFromUnitVectors(v(0, -1, 0), dir);
    root.add(sleeve);
    bones[`UpperArm${side}`].attach(sleeve);
  }

  // Galão de alvejante pendurado na mão, inclinado pra frente, pingando
  const bottleMat = ps1(new THREE.MeshLambertMaterial({ map: bottleTexture(), flatShading: true }));
  const bottle = new THREE.Group();
  const jug = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.13), bottleMat);
  jug.position.set(0, -0.12, 0.03);
  bottle.add(jug);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.011, 3, 6, Math.PI), bottleMat);
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0, -0.025, -0.0);
  bottle.add(handle);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 6), ps1(new THREE.MeshLambertMaterial({ color: 0xd4521e })));
  cap.position.set(0, -0.005, 0.075);
  bottle.add(cap);
  const hand = P(bones.HandR);
  bottle.position.copy(hand).add(v(0, -0.07, 0.02));
  bottle.rotation.x = 0.55;
  root.add(bottle);
  bones.HandR.attach(bottle);

  const ember = new THREE.MeshBasicMaterial({ color: 0xff6a1a });
  const drips = [];
  const dripGeo = new THREE.BoxGeometry(0.012, 0.026, 0.012);
  for (let k = 0; k < 6; k++) {
    const d = new THREE.Mesh(dripGeo, ember);
    d.userData.t = k / 6;
    drips.push(d);
    root.add(d);
  }

  const rest = Object.fromEntries(['Torso', 'Neck', 'Head'].map((n) => [n, bones[n].quaternion.clone()]));
  return { root, bones, rest, cap, drips, spout: new THREE.Vector3(), cloth };
}

// Esqueleto PSX vestindo a camiseta, luz azul/vermelha estilo clipe "Camelot"
// print: estampa inicial (ou fixa, com cycle=false); cycle: clique troca a estampa
export default function Skeleton3D({ fallback, print = PRINT_IDS[0], cycle = true }) {
  const wrapRef = useRef(null);
  const apiRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [printId, setPrintId] = useState(PRINTS[print] ? print : PRINT_IDS[0]);
  const [glitch, setGlitch] = useState(false);
  const printRef = useRef(printId);
  const clothRef = useRef(null);

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
    scene.fog = new THREE.Fog(0x06060c, 2.6, 5.2);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    // Câmera baixa olhando pra cima: o esqueleto fica imponente
    camera.position.set(0, 0.9, 2.5);
    camera.lookAt(0, 1.15, 0);

    scene.add(new THREE.AmbientLight(0x1c2240, 2.2));
    const key = new THREE.DirectionalLight(0x7f9cff, 2.4);
    key.position.set(-1.4, 1.2, 1.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff2a3c, 3.2);
    rim.position.set(1.5, 1.4, -1.6);
    scene.add(rim);
    const torch = new THREE.PointLight(0xff6a1a, 1.6, 0, 1.4);
    torch.position.set(0.9, 0.7, 0.9);
    scene.add(torch);

    const pivot = new THREE.Group();
    scene.add(pivot);
    let parts = null;

    // Resolução baixa de propósito
    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const scale = w < 500 ? 2 : 2.4;
      const iw = Math.max(80, Math.round(w / scale));
      const ih = Math.max(80, Math.round(h / scale));
      renderer.setSize(iw, ih, false);
      camera.aspect = iw / ih;
      camera.updateProjectionMatrix();
      ps1Uniforms.uSnap.value.set(iw / 2, ih / 2);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rotY = 0.35;
    let velocity = 0;
    let dragging = null;
    let visible = true;
    let raf = 0;
    const t0 = performance.now();
    const axisX = new THREE.Vector3(1, 0, 0);
    const axisZ = new THREE.Vector3(0, 0, 1);
    const tmpQ = new THREE.Quaternion();

    const frame = () => {
      const t = reduced ? 0 : (performance.now() - t0) / 1000;
      if (!dragging) {
        rotY += velocity;
        velocity *= 0.94;
        rotY += (0.35 + Math.sin(t * 0.25) * 0.25 - rotY) * 0.01; // volta devagar pra pose de 3/4
      }
      pivot.rotation.y = rotY;

      if (parts) {
        const { bones, rest } = parts;
        // Respira, cabeça pende e balança
        bones.Torso.quaternion.copy(rest.Torso);
        rotateBoneWorld(bones.Torso, tmpQ.setFromAxisAngle(axisX, 0.06 + Math.sin(t * 1.4) * 0.015));
        bones.Head.quaternion.copy(rest.Head);
        rotateBoneWorld(bones.Head, tmpQ.setFromAxisAngle(axisX, 0.14 + Math.sin(t * 0.7) * 0.05));
        rotateBoneWorld(bones.Head, tmpQ.setFromAxisAngle(axisZ, Math.sin(t * 0.4) * 0.08));

        parts.cap.getWorldPosition(parts.spout);
        pivot.worldToLocal(parts.spout);
        parts.drips.forEach((d) => {
          d.userData.t = (d.userData.t + 0.012) % 1;
          const p = d.userData.t;
          d.position.set(parts.spout.x, parts.spout.y - p * p * 1.1, parts.spout.z);
          d.visible = p > 0.03;
        });
      }
      torch.intensity = 1.6 * (0.8 + 0.14 * Math.sin(t * 13) + 0.06 * Math.sin(t * 31));

      renderer.render(scene, camera);
      if (visible) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (!wrap.isConnected) return;
        parts = buildScene(gltf, printRef.current);
        pivot.add(parts.root);
        clothRef.current = parts.cloth;
      },
      undefined,
      () => setFailed(true)
    );

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
        printRef.current = id;
        const cloth = clothRef.current;
        if (!cloth) return;
        cloth.map.dispose();
        cloth.map = shirtTexture(id);
        cloth.needsUpdate = true;
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
