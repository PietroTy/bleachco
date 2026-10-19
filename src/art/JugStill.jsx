import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ps1Uniforms, PX } from './ps1';
import { logoJug } from './logoJug';

// O galão que o esqueleto segura, em pé e parado (página Sobre): mesma luz e mesmo pixel do esqueleto,
// renderizado de novo só quando o tamanho muda
export default function JugStill({ className = '' }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch {
      return undefined;
    }
    const canvas = renderer.domElement;
    canvas.className = 'jug-still-canvas';
    wrap.appendChild(canvas);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
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

    const { jug } = logoJug();
    // Origem do galão é o furo da alça; centraliza o corpo e vira um pouco (3/4) pra mostrar volume
    const box = new THREE.Box3().setFromObject(jug);
    const center = box.getCenter(new THREE.Vector3());
    jug.position.sub(center);
    const pivot = new THREE.Group();
    pivot.add(jug);
    pivot.rotation.y = -0.45;
    scene.add(pivot);
    const size = box.getSize(new THREE.Vector3());

    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 10);
    const dist = (size.y * 0.75) / Math.tan(THREE.MathUtils.degToRad(15));
    camera.position.set(0, size.y * 0.08, dist);
    camera.lookAt(0, 0, 0);

    const render = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const iw = Math.max(40, Math.round(w / PX));
      const ih = Math.max(40, Math.round(h / PX));
      renderer.setSize(iw, ih, false);
      camera.aspect = iw / ih;
      camera.updateProjectionMatrix();
      ps1Uniforms.uSnap.value.set(iw / 2, ih / 2);
      renderer.render(scene, camera);
    };
    render();
    const ro = new ResizeObserver(render);
    ro.observe(wrap);

    return () => {
      ro.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { o.material.map?.dispose(); o.material.dispose(); }
      });
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={wrapRef} className={`jug-still ${className}`} aria-hidden="true" />;
}
