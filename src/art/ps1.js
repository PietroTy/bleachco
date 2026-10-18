import * as THREE from 'three';

// Efeito PS1 nos materiais do three.js:
// - vértices presos numa grade de tela (o "tremido" do PlayStation 1)
// - cores reduzidas com pontilhado ordenado (dithering 4x4)
export const ps1Uniforms = { uSnap: { value: new THREE.Vector2(160, 120) } };

export function ps1(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSnap = ps1Uniforms.uSnap;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec2 uSnap;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 snapped = gl_Position;
        snapped.xyz /= snapped.w;
        snapped.xy = floor(snapped.xy * uSnap + 0.5) / uSnap;
        snapped.xyz *= gl_Position.w;
        gl_Position = snapped;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        float bayer4(vec2 p) {
          int x = int(mod(p.x, 4.0));
          int y = int(mod(p.y, 4.0));
          float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
          return m[x + y * 4] / 16.0 - 0.5;
        }`
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        gl_FragColor.rgb += bayer4(gl_FragCoord.xy) / 20.0;
        gl_FragColor.rgb = floor(gl_FragColor.rgb * 20.0 + 0.5) / 20.0;`
      );
  };
  return material;
}

// Textura minúscula sem suavização (pixel duro)
export function pixelTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function noiseCanvas(w, h, base, spread, seed = 7) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < w * h; i++) {
    const n = (rnd() - 0.5) * spread;
    img.data[i * 4] = base[0] + n;
    img.data[i * 4 + 1] = base[1] + n;
    img.data[i * 4 + 2] = base[2] + n;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
