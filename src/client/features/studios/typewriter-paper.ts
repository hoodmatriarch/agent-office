import * as THREE from 'three';
/** A code-drawn parchment/ink surface for the physical writing station. */
export function typewriterPaper(text: string) {
  const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 600;
  const g = canvas.getContext('2d')!; g.fillStyle = '#f4e9d3'; g.fillRect(0, 0, 900, 600);
  const stain = g.createRadialGradient(40, 560, 20, 40, 560, 420); stain.addColorStop(0, '#b9853520'); stain.addColorStop(1, '#b9853500');
  g.fillStyle = stain; g.fillRect(0, 0, 900, 600);
  g.fillStyle = '#b7996820'; for (let y = 0; y < 600; y += 6) for (let x = 0; x < 900; x += 11) g.fillRect(x + y % 11, y, 1, 1);
  g.font = '25px "Courier New", Courier, monospace'; g.fillStyle = '#3e3529';
  text.split('\n').slice(0, 18).forEach((line, i) => { g.fillText(line.slice(0, 60), 30, 40 + i * 30); g.globalAlpha = .12; g.fillText(line.slice(0, 60), 30.3, 40.2 + i * 30); g.globalAlpha = 1; });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
