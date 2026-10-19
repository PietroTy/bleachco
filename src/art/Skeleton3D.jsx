import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ps1, ps1Uniforms, pixelTexture, noiseCanvas } from './ps1';
import teeUrl from '../assets/tshirt.glb';
import blenderPose from '../assets/pose.json';

// Inclinação fixa somada à respiração: só na pose do código; a do Blender já vem como a pessoa quis
const LEAN = Object.keys(blenderPose).length ? { torso: 0, head: 0 } : { torso: 0.06, head: 0.05 };

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
  const c = noiseCanvas(128, 128, [34, 33, 36], 16, 11);
  const ctx = c.getContext('2d');
  // UV é uma projeção de frente (largura x altura da camiseta): peito em ~30% do topo.
  // Costas e laterais apontam pro canto (0,0) da textura, que é só tecido.
  PRINTS[printId].draw(ctx, 64, 40, 19);
  // Respingos soltos de alvejante pelo tecido
  ctx.fillStyle = 'rgba(212,82,30,0.55)';
  [[40, 70], [88, 30], [70, 92], [20, 50], [104, 80]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
  const tex = pixelTexture(c);
  tex.flipY = false; // UV de glTF: topo da imagem = topo da camiseta
  return tex;
}

// Galão da logo (o "b" de bleach.co), desenhado em px da logo: corpo arredondado, ombro descendo
// até a direita, alça vazada inclinada, etiqueta laranja e tampa canelada em cima à esquerda.
// Origem no centro do furo da alça: é ali que entram os dedos.
const HANDLE_AT = 0.13; // distância do punho até o furo, no osso da mão
const ROLL = 0.5 + Math.PI; // de cabeça pra baixo: tampa embaixo, base pra cima

function logoJug() {
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

// Modelo: "Low poly retro PSX skeleton" por LonesomeDucky (OpenGameArt, CC-BY 4.0)
const MODEL_URL = `${process.env.PUBLIC_URL}/models/skeleton/skeleton.gltf`;
// Camiseta: "T-shirt" por Poly by Google (poly.pizza, CC-BY 3.0), com UV refeito pra estampa
// importado (não em public/): o build dá um nome novo a cada versão, então o navegador nunca mistura
// código novo com camiseta velha em cache
const TEE_URL = teeUrl;

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

// Osso que fica dentro da camiseta não aparece: cada ponto é levado de volta pra pose de repouso pelo osso
// do tronco e pelos dos braços (como no skinning) e testado contra medidas fixas da camiseta nessa pose:
// um cilindro elíptico no tronco e um em volta do úmero. Pega ponta de clavícula e escápula rente ao tecido.
const hideInverse = { value: [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()] };
// Índices (no esqueleto) da cabeça e do pescoço: o que é deles nunca some (com a cabeça baixa, o queixo
// entra na área do tronco e era cortado)
const keepBones = { value: new THREE.Vector2(-1, -1) };
function hideInsideShirt(material) {
  const base = material.onBeforeCompile;
  material.onBeforeCompile = (shader) => {
    base(shader);
    shader.uniforms.uHideInv = hideInverse;
    shader.uniforms.uKeep = keepBones;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vObjPos;\nvarying float vKeep;\nuniform vec2 uKeep;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvObjPos = transformed;\nvKeep = dot(skinWeight, vec4(equal(skinIndex, vec4(uKeep.x))) + vec4(equal(skinIndex, vec4(uKeep.y))));');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform mat4 uHideInv[3];
        varying float vKeep;
        varying vec3 vWorldPos;
        varying vec3 vObjPos;
        float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float vnoise(vec3 p) {
          vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
        }`
      )
      // Osso na cor das letras: creme quase branco com manchas laranja/ferrugem (presas no corpo,
      // não escorregam quando ele gira). O relevo da textura original fica só como sombreado.
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 bone = vec3(0.96, 0.94, 0.9) * clamp(lum * 1.7, 0.0, 1.05); // claro-escuro da textura (órbitas, dentes)
        float n = vnoise(vObjPos * 14.0) * 0.65 + vnoise(vObjPos * 37.0) * 0.35;
        bone = mix(bone, bone * vec3(0.95, 0.68, 0.48), smoothstep(0.5, 0.62, n));
        bone = mix(bone, bone * vec3(0.88, 0.36, 0.14), smoothstep(0.64, 0.76, n));
        diffuseColor.rgb = bone;`
      )
      // Parte da cor vale mesmo sem luz: osso continua claro do lado de sombra
      .replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, diffuseColor.rgb, 0.12);\n#include <opaque_fragment>')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        if (vKeep < 0.5) {
        vec3 tp = (uHideInv[0] * vec4(vWorldPos, 1.0)).xyz;
        bool neck = tp.y > 1.45 && pow(tp.x / 0.04, 2.0) + pow((tp.z + 0.085) / 0.05, 2.0) < 1.0;
        if (tp.y > 0.9 && tp.y < 1.5 && !neck && pow(tp.x / 0.19, 2.0) + pow((tp.z + 0.042) / 0.14, 2.0) < 1.0) discard;
        // Úmero dentro da manga, no repouso de cada braço
        for (int k = 1; k < 3; k++) {
          vec3 ap = (uHideInv[k] * vec4(vWorldPos, 1.0)).xyz;
          float sd = k == 1 ? 1.0 : -1.0;
          vec3 sh = vec3(sd * 0.168, 1.398, -0.081);
          vec3 ax = normalize(vec3(sd * 0.038, -0.296, 0.028));
          float al = dot(ap - sh, ax);
          if (sd * ap.x > 0.1 && al > -0.05 && al < 0.11 && length(ap - sh - ax * al) < 0.045) discard;
        }
        }
`
      );
  };
  return material;
}

function buildScene(gltf, teeGltf, printId) {
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


  // Camiseta: moldada no Blender (tools/teefixed.blend) e presa nos ossos lá (tools/rig_tee.py): vem com o
  // rig, cada vértice com peso no tronco/ombro/braço. Aqui só troca os ossos do arquivo dela pelos ossos de
  // mesmo nome deste esqueleto (a pose de repouso é a mesma), então qualquer pose deforma a camiseta junto.
  const cloth = ps1(new THREE.MeshLambertMaterial({ map: shirtTexture(printId), side: THREE.DoubleSide }));
  let teeMesh = null;
  teeGltf.scene.traverse((o) => {
    if (o.isSkinnedMesh) teeMesh = o;
  });
  // Sem camiseta com rig (arquivo inesperado), o esqueleto aparece mesmo assim, só sem ela
  let hideBones = [];
  if (teeMesh) {
    hideInsideShirt(skin.material); // osso dentro da camiseta some
    keepBones.value.set(skin.skeleton.bones.indexOf(bones.Head), skin.skeleton.bones.indexOf(bones.Neck));
    teeMesh.material.dispose();
    const shirt = new THREE.SkinnedMesh(teeMesh.geometry, cloth);
    shirt.frustumCulled = false;
    root.add(shirt);
    root.updateWorldMatrix(true, true);
    const teeBones = teeMesh.skeleton.bones.map((b) => bones[b.name]);
    shirt.bind(new THREE.Skeleton(teeBones, teeMesh.skeleton.boneInverses.map((m) => m.clone())), new THREE.Matrix4());
    // Ossos que o shader usa pra esconder osso dentro da camiseta (repouso → pose atual de cada um)
    hideBones = ['Torso', 'UpperArmL', 'UpperArmR'].map((n) => ({ bone: bones[n], inv: shirt.skeleton.boneInverses[teeBones.indexOf(bones[n])] }));
  }

  // Pose: a do Blender (tools/teefixed.blend, Pose Mode → export_tee.py grava src/assets/pose.json) se tiver;
  // senão a do código. A camiseta presa nos ossos acompanha qualquer uma.
  const P = (b) => b.getWorldPosition(new THREE.Vector3());
  root.updateWorldMatrix(true, true);
  if (Object.keys(blenderPose).length) {
    // Cada entrada é a rotação do osso desde o repouso, no espaço do esqueleto (root ainda sem pai):
    // mundo desejado = delta × mundo de repouso; pais primeiro (ordem da árvore)
    const restWorld = new Map();
    root.traverse((o) => o.isBone && restWorld.set(o, o.getWorldQuaternion(new THREE.Quaternion())));
    root.traverse((o) => {
      const q = o.isBone && blenderPose[o.name.replace('.', '')];
      if (!q) return;
      const want = new THREE.Quaternion(...q).multiply(restWorld.get(o));
      o.quaternion.copy(o.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(want));
      o.updateWorldMatrix(false, true);
    });
  } else {
    // Pescoço do modelo vem caído pra frente: endireita, e o rosto volta a olhar pra frente
    rotateBoneWorld(bones.Neck, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.28));
    root.updateWorldMatrix(true, true);
    rotateBoneWorld(bones.Head, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3));
    root.updateWorldMatrix(true, true);
    // Braço no ângulo da manga (o de repouso), só o antebraço dobra. Direito desce pro galão
    const bend = (lower, hand, fore) => aimBone(lower, hand, P(lower).add(fore));
    bend(bones.LowerArmR, bones.HandR, v(0.04, -0.24, 0.1));
    bend(bones.LowerArmL, bones.HandL, v(-0.03, -0.24, 0.05));
  }
  root.updateWorldMatrix(true, true);

  // Galão de alvejante pendurado na mão, inclinado pra frente, pingando
  const { jug: bottle, cap } = logoJug();
  const hand = P(bones.HandR);
  // Furo da alça no meio dos dedos (eixo do osso da mão = +Y local dele), com o furo atravessado
  // pelos dedos: no espaço da mão, o eixo do furo (Z do galão) é o X da mão e o galão pende pros dedos.
  // ROLL gira o galão em volta do próprio furo (tampa pra baixo → o pingo sai dela).
  const handQ = bones.HandR.getWorldQuaternion(new THREE.Quaternion());
  bottle.position.copy(hand).add(v(0, HANDLE_AT, 0).applyQuaternion(handQ));
  const inHand = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v(0, 0, 1), v(0, -1, 0), v(1, 0, 0)));
  bottle.quaternion.copy(handQ).multiply(inHand).multiply(new THREE.Quaternion().setFromAxisAngle(v(0, 0, 1), ROLL));
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
  return { root, bones, rest, cap, drips, spout: new THREE.Vector3(), cloth, hideBones };
}

// Esqueleto PSX vestindo a camiseta, luz quente: osso branco com contraluz laranja (cores da marca)
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
    scene.fog = new THREE.Fog(0x0c0806, 2.6, 5.2);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
    // Câmera baixa olhando pra cima: o esqueleto fica imponente
    camera.position.set(0, 0.9, 2.5);
    camera.lookAt(0, 1.15, 0);

    scene.add(new THREE.AmbientLight(0x2a201a, 1.5));
    const key = new THREE.DirectionalLight(0xfff1e6, 1.9);
    key.position.set(-1.4, 1.2, 1.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3a1a, 3.4);
    rim.position.set(1.5, 1.4, -1.6);
    scene.add(rim);
    const torch = new THREE.PointLight(0xff6a1a, 2.4, 0, 1.4);
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
        rotateBoneWorld(bones.Torso, tmpQ.setFromAxisAngle(axisX, LEAN.torso + Math.sin(t * 1.4) * 0.015));
        bones.Head.quaternion.copy(rest.Head);
        rotateBoneWorld(bones.Head, tmpQ.setFromAxisAngle(axisX, LEAN.head + Math.sin(t * 0.7) * 0.04));
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
      torch.intensity = 2.4 * (0.75 + 0.18 * Math.sin(t * 13) + 0.07 * Math.sin(t * 31));

      if (parts) {
        scene.updateMatrixWorld();
        // mundo → repouso de cada osso (o inverso da matriz de skinning dele)
        parts.hideBones.forEach((h, k) => hideInverse.value[k].multiplyMatrices(h.bone.matrixWorld, h.inv).invert());
      }
      renderer.render(scene, camera);
      if (visible) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const loader = new GLTFLoader();
    Promise.all([loader.loadAsync(MODEL_URL), loader.loadAsync(TEE_URL)])
      .then(([gltf, teeGltf]) => {
        if (!wrap.isConnected) return;
        parts = buildScene(gltf, teeGltf, printRef.current);
        pivot.add(parts.root);
        clothRef.current = parts.cloth;
      })
      .catch(() => setFailed(true));

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
