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
// Camiseta: "T-shirt" por Poly by Google (poly.pizza, CC-BY 3.0), com UV refeito pra estampa
const TEE_URL = `${process.env.PUBLIC_URL}/models/tshirt.glb`;

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

// Osso que fica dentro da camiseta não aparece: descarta o fragmento se ele cai num cilindro elíptico
// um pouco menor que o corpo da camiseta (coordenadas da malha dela). Evita escápula furando o tecido.
const teeInverse = { value: new THREE.Matrix4() };
// Idem pro úmero dentro da manga: matriz inversa de cada braço + eixo do osso (xyz) e até onde a manga cobre (w)
const armInverse = { value: [new THREE.Matrix4(), new THREE.Matrix4()] };
const armAxis = { value: [new THREE.Vector4(), new THREE.Vector4()] };
function hideInsideShirt(material) {
  const base = material.onBeforeCompile;
  material.onBeforeCompile = (shader) => {
    base(shader);
    shader.uniforms.uTeeInv = teeInverse;
    shader.uniforms.uArmInv = armInverse;
    shader.uniforms.uArmAxis = armAxis;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vObjPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvObjPos = transformed;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform mat4 uTeeInv;
        uniform mat4 uArmInv[2];
        uniform vec4 uArmAxis[2];
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
        vec3 tp = (uTeeInv * vec4(vWorldPos, 1.0)).xyz;
        // Corpo da camiseta, até um pouco acima do ombro (clavícula e escápula não furam a gola),
        // menos um cilindro em volta do pescoço, que sai pela gola
        bool neck = tp.y > 0.86 && pow(tp.x / 0.055, 2.0) + pow((tp.z + 0.03) / 0.075, 2.0) < 1.0;
        if (tp.y > 0.04 && tp.y < 1.1 && !neck && pow(tp.x / 0.3, 2.0) + pow(tp.z / 0.17, 2.0) < 1.0) discard;
        for (int k = 0; k < 2; k++) {
          vec3 ap = (uArmInv[k] * vec4(vWorldPos, 1.0)).xyz;
          float along = dot(ap, uArmAxis[k].xyz);
          if (along > -0.06 && along < uArmAxis[k].w && length(ap - uArmAxis[k].xyz * along) < 0.06) discard;
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
  skin.material = hideInsideShirt(ps1(new THREE.MeshLambertMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide })));
  skin.frustumCulled = false;

  // Camiseta: modelo pronto, preso no tronco
  const cloth = ps1(new THREE.MeshLambertMaterial({ map: shirtTexture(printId), side: THREE.DoubleSide }));
  const tee = teeGltf.scene;
  tee.traverse((o) => {
    if (o.isMesh) {
      o.material.dispose();
      o.material = cloth;
    }
  });
  // Medidas da malha (altura 1): costura do ombro em x 0.27 / z 0.9 → encaixa no ombro do esqueleto
  tee.scale.set(0.6, 0.57, 0.8); // gola em ~1.45: abraça o pescoço, não o queixo // um pouco mais funda que a malha (tórax do esqueleto), sem virar bloco de lado
  // O modelo vem com o pescoço caído pra frente: endireita pra cabeça ficar em cima da gola
  rotateBoneWorld(bones.Neck, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.28));
  root.updateWorldMatrix(true, true);
  rotateBoneWorld(bones.Head, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3)); // e o rosto volta a olhar pra frente
  root.updateWorldMatrix(true, true);
  tee.position.set(bones.Neck.getWorldPosition(new THREE.Vector3()).x, 0.88, -0.035); // esqueleto não é simétrico: centra no pescoço
  root.add(tee);
  root.updateWorldMatrix(true, true);

  // Pose de encaixe: cada braço mira o centro da abertura da sua manga
  const P = (b) => b.getWorldPosition(new THREE.Vector3());
  // Ombro de cada lado em coordenadas da malha: a manga afunila em volta da linha ombro → abertura
  const shoulderLocal = { [-1]: tee.worldToLocal(P(bones.UpperArmR)), 1: tee.worldToLocal(P(bones.UpperArmL)) };
  // Centro real de cada abertura, medido na malha (o modelo não é simétrico: uma manga vai pra
  // frente e a outra pra trás). Ponta da manga = vértices mais longe do ombro na direção dela.
  const teeGeo = tee.getObjectByProperty('isMesh', true).geometry.attributes.position;
  const sleeve = {};
  for (const side of [-1, 1]) {
    const sh = shoulderLocal[side];
    const pts = [];
    for (let i = 0; i < teeGeo.count; i++) {
      const p = new THREE.Vector3().fromBufferAttribute(teeGeo, i);
      if (side * p.x > 0.3 && p.y < sh.y) pts.push(p);
    }
    const mean = (list) => list.reduce((m, p) => m.add(p), new THREE.Vector3()).divideScalar(list.length);
    const dir = mean(pts).sub(sh).normalize();
    const along = pts.map((p) => p.clone().sub(sh).dot(dir));
    const far = Math.max(...along);
    const opening = mean(pts.filter((p, k) => along[k] > far - 0.05));
    const axis = opening.clone().sub(sh);
    sleeve[side] = { opening, axis, len: axis.length() };
  }
  const sleeveOpening = (side) => tee.localToWorld(sleeve[side].opening.clone());
  aimBone(bones.UpperArmR, bones.LowerArmR, sleeveOpening(-1));
  aimBone(bones.UpperArmL, bones.LowerArmL, sleeveOpening(1));
  root.updateWorldMatrix(true, true);
  // Quanto do úmero a manga cobre (em unidades do mundo, no eixo do osso), pro shader esconder o que fura
  const arms = [[bones.UpperArmL, bones.LowerArmL, 1], [bones.UpperArmR, bones.LowerArmR, -1]].map(([upper, lower, side], k) => {
    const worldLen = P(lower).distanceTo(P(upper));
    const scale = worldLen / lower.position.length(); // osso local → mundo
    const reach = sleeveOpening(side).sub(P(upper)).dot(P(lower).sub(P(upper)).normalize());
    const dir = lower.position.clone().normalize();
    armAxis.value[k].set(dir.x, dir.y, dir.z, reach * 0.95);
    return { bone: upper, scale: new THREE.Matrix4().makeScale(scale, scale, scale) };
  });

  // "Esqueleto na camiseta": vira malha com pele presa nos ossos nessa pose. Manga segue o úmero,
  // corpo segue o tronco; na costura do ombro (|x| 0.22–0.3, acima da axila) mistura os dois
  const teeMesh = tee.getObjectByProperty('isMesh', true);
  const geo = teeMesh.geometry.clone();
  const local = new THREE.Vector3();
  const pos = geo.attributes.position;
  const count = pos.count;
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    local.fromBufferAttribute(pos, i);
    const arm = THREE.MathUtils.smoothstep(Math.abs(local.x), 0.22, 0.3) * THREE.MathUtils.smoothstep(local.y, 0.42, 0.5);
    // Manga afunilada em volta do eixo dela (ombro → abertura), pra não abrir em aba longe do braço
    if (arm > 0) {
      const side = Math.sign(local.x);
      const sh = shoulderLocal[side];
      const { axis, len } = sleeve[side];
      const t = THREE.MathUtils.clamp(_b.copy(local).sub(sh).dot(axis) / (len * len), 0, 1);
      _a.copy(sh).addScaledVector(axis, t); // ponto do eixo na altura do vértice
      local.lerp(_a, (0.25 + 0.25 * t) * arm); // aperta mais perto da abertura, em volta do osso
      pos.setXYZ(i, local.x, local.y, local.z);
    }
    skinIndex.set([0, local.x < 0 ? 2 : 1, 0, 0], i * 4);
    skinWeight.set([1 - arm, arm, 0, 0], i * 4);
  }
  geo.applyMatrix4(teeMesh.matrixWorld); // malha passa pro espaço do root (root ainda sem pai)
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  geo.computeVertexNormals();
  root.remove(tee);
  teeMesh.geometry.dispose();
  const shirt = new THREE.SkinnedMesh(geo, cloth);
  shirt.frustumCulled = false;
  root.add(shirt);
  shirt.updateWorldMatrix(true, false);
  const teeSkeleton = new THREE.Skeleton([bones.Torso, bones.UpperArmL, bones.UpperArmR]);
  shirt.bind(teeSkeleton, shirt.matrixWorld); // calcula o "bind" na pose de encaixe

  // Referência que acompanha o tronco, pro shader esconder osso dentro do corpo da camiseta
  const teeFrame = new THREE.Object3D();
  teeFrame.position.copy(tee.position);
  teeFrame.scale.copy(tee.scale);
  root.add(teeFrame);
  bones.Torso.attach(teeFrame);

  // Pose final: braços mais soltos junto ao corpo, a manga vem junto. Antebraço direito desce pro galão
  const relax = (side, upper, lower, hand, fore) => {
    const sh = P(upper);
    aimBone(upper, lower, sh.clone().add(v(side * 0.15, -0.3, 0.03))); // perto do ângulo da manga: ombro não torce
    const el = P(lower);
    aimBone(lower, hand, el.clone().add(fore));
  };
  relax(-1, bones.UpperArmR, bones.LowerArmR, bones.HandR, v(0.06, -0.24, 0.1));
  relax(1, bones.UpperArmL, bones.LowerArmL, bones.HandL, v(-0.07, -0.24, 0.05));
  root.updateWorldMatrix(true, true);

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
  return { root, bones, rest, cap, drips, spout: new THREE.Vector3(), cloth, teeFrame, arms };
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
        rotateBoneWorld(bones.Torso, tmpQ.setFromAxisAngle(axisX, 0.06 + Math.sin(t * 1.4) * 0.015));
        bones.Head.quaternion.copy(rest.Head);
        rotateBoneWorld(bones.Head, tmpQ.setFromAxisAngle(axisX, 0.05 + Math.sin(t * 0.7) * 0.04));
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
        teeInverse.value.copy(parts.teeFrame.matrixWorld).invert();
        parts.arms.forEach((a, k) => armInverse.value[k].copy(a.bone.matrixWorld).invert().premultiply(a.scale));
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
