import * as THREE from 'three';
import { mesh, roundedBox, toon } from '../../world/toon';
import type { Interactable } from '../../world/types';

/** A friendly, original robot made from the office's own cartoon geometry. */
export class GuideBot {
  readonly root = new THREE.Group();
  readonly interact: Interactable = { kind: 'guide', x: 7, z: -8, radius: 2.2, label: 'Pip · your office guide' };
  private readonly body = new THREE.Group();
  private readonly arms: THREE.Group[] = [];
  private readonly feet: THREE.Mesh[] = [];
  private readonly label = document.createElement('canvas');
  private readonly texture = new THREE.CanvasTexture(this.label);
  private line = '';

  constructor() {
    const blue = toon('#4388ef');
    const white = toon('#f6f9ff');
    const ink = toon('#25334a');
    const glow = new THREE.MeshBasicMaterial({ color: '#85efd0' });
    this.root.add(this.body);
    this.body.add(mesh(roundedBox(0.52, 0.52, 0.35, 0.08), white, 0, 0.67, 0));
    this.body.add(mesh(roundedBox(0.57, 0.42, 0.39, 0.08), blue, 0, 1.18, 0));
    this.body.add(mesh(roundedBox(0.47, 0.25, 0.035, 0.04), ink, 0, 1.18, 0.205));
    for (const x of [-0.12, 0.12]) {
      this.body.add(mesh(new THREE.SphereGeometry(0.045, 12, 8), glow, x, 1.21, 0.24, false));
      const foot = mesh(roundedBox(0.2, 0.15, 0.29, 0.05), ink, x, 0.14, 0.02);
      this.feet.push(foot); this.root.add(foot);
      this.root.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.25, 8), blue, x, 0.33, 0));
    }
    this.body.add(mesh(roundedBox(0.13, 0.03, 0.02, 0.01), glow, 0, 1.1, 0.24, false));
    this.body.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), ink, 0, 1.46, 0));
    this.body.add(mesh(new THREE.SphereGeometry(0.045, 12, 8), glow, 0, 1.55, 0, false));
    this.body.add(mesh(new THREE.CircleGeometry(0.105, 24), blue, 0, 0.69, 0.181, false));
    this.body.add(mesh(new THREE.BoxGeometry(0.025, 0.12, 0.02), white, 0, 0.69, 0.193, false));
    this.body.add(mesh(new THREE.BoxGeometry(0.12, 0.025, 0.02), white, 0, 0.69, 0.194, false));
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * 0.35, 0.83, 0);
      arm.add(mesh(roundedBox(0.12, 0.32, 0.13, 0.035), blue, 0, -0.13, 0));
      arm.add(mesh(new THREE.SphereGeometry(0.08, 12, 8), white, 0, -0.3, 0));
      this.arms.push(arm); this.body.add(arm);
    }
    this.label.width = 768; this.label.height = 144;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texture, depthTest: true, toneMapped: false }));
    badge.position.set(0, 1.95, 0); badge.scale.set(2.9, 0.54, 1);
    this.root.add(badge);
    this.root.userData.interact = this.interact;
    this.say('Ask me anything about this office');
  }

  say(text: string) {
    if (text === this.line) return;
    this.line = text;
    const g = this.label.getContext('2d')!;
    g.clearRect(0, 0, 768, 144);
    g.fillStyle = '#f6f9ff'; g.beginPath(); g.roundRect(3, 3, 762, 138, 24); g.fill();
    g.strokeStyle = '#4388ef'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#25334a'; g.textAlign = 'center';
    g.font = '800 38px Nunito, sans-serif'; g.fillText('PIP · YOUR OFFICE GUIDE', 384, 53);
    g.font = '700 28px Nunito, sans-serif'; g.fillText(text, 384, 106, 728);
    this.texture.needsUpdate = true;
  }

  update(x: number, z: number, yaw: number, walking: boolean, near: boolean, time: number) {
    this.root.position.set(x, 0, z); this.root.rotation.y = yaw;
    this.interact.x = x; this.interact.z = z;
    this.body.position.y = walking ? Math.abs(Math.sin(time * 9)) * 0.025 : Math.sin(time * 2) * 0.012;
    for (let i = 0; i < this.feet.length; i++) this.feet[i].position.z = 0.02 + (walking ? Math.sin(time * 9 + i * Math.PI) * 0.075 : 0);
    this.arms[0].rotation.x = walking ? Math.sin(time * 9) * 0.35 : 0;
    this.arms[1].rotation.z = near && !walking ? -0.7 + Math.sin(time * 5) * 0.2 : 0;
    this.arms[1].rotation.x = walking ? -Math.sin(time * 9) * 0.35 : 0;
  }
}
