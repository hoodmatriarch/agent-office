import * as THREE from 'three';
import { nearestWalkable, route, type Pt } from '../../../shared/nav';
import { Person } from '../../world/character';
import { disposeSprite, textSprite } from '../../world/toon';
import type { Interactable } from '../../world/types';
import { CAST } from './cast';
import type { Snapshot } from './simulation';

interface Actor {
  person: Person;
  it: Interactable;
  path: Pt[];
  destination: string;
  line: string;
  label?: THREE.Sprite;
  bubble?: THREE.Sprite;
}

/** Ambient cast never takes a worker seat, collider, socket or agent session. */
export class AmbientWorld {
  readonly root = new THREE.Group();
  readonly actors = new Map<string, Actor>();

  constructor() {
    this.root.name = 'ambient-office';
    for (const p of CAST) {
      const person = new Person(p.name, p.color, p.look);
      person.setLabel(p.name, null);
      const label = person.root.children.find((child): child is THREE.Sprite => child instanceof THREE.Sprite);
      label?.scale.multiplyScalar(0.75);
      person.root.name = `ambient-${p.id}`;
      const at = nearestWalkable(p.home);
      person.root.position.set(at[0], 0, at[1]);
      const it: Interactable = { kind: 'ambientnpc', decorId: p.id, x: at[0], z: at[1], radius: 2.2, off: true };
      person.root.userData.interact = it;
      // Simple costume cues on the existing chibi rigs, without copying model assets.
      if (['michael', 'dwight', 'jim', 'david', 'andy'].includes(p.id)) {
        const material = new THREE.MeshToonMaterial({ color: p.id === 'dwight' ? '#72543b' : '#34415c' });
        const geometry = new THREE.BoxGeometry(0.065, 0.28, 0.03);
        const tie = new THREE.Mesh(geometry, material);
        tie.position.set(0, 1.13, 0.205);
        person.root.add(tie);
      }
      this.root.add(person.root);
      this.actors.set(p.id, { person, it, path: [], destination: '', line: '', label });
    }
  }

  usable(): Interactable[] {
    return this.root.visible ? [...this.actors.values()].filter((a) => !a.it.off).map((a) => a.it) : [];
  }

  update(snapshot: Snapshot, dt: number, t: number, show: boolean, quiet: boolean, busy: string | null, viewer: { x: number; z: number }) {
    this.root.visible = show;
    for (const state of snapshot.people) {
      const actor = this.actors.get(state.person.id)!;
      actor.person.root.visible = state.present || busy === state.person.id;
      actor.it.off = !show || !actor.person.root.visible;
      if (actor.it.off) {
        this.say(actor, '');
        continue;
      }
      const pos = actor.person.root.position;
      const occupied = busy === state.person.id;
      const destination = state.target.join(',');
      if (!occupied && destination !== actor.destination) {
        actor.destination = destination;
        const goal = nearestWalkable(state.target);
        actor.path = route([pos.x, pos.z], goal);
      }
      let budget = Math.min(dt, 0.1) * 1.9;
      const moving = !occupied && actor.path.length > 0;
      while (budget > 0 && !occupied && actor.path.length) {
        const [x, z] = actor.path[0];
        const distance = Math.hypot(x - pos.x, z - pos.z);
        if (distance > 0.01) actor.person.root.rotation.y = Math.atan2(x - pos.x, z - pos.z);
        if (distance <= budget) {
          pos.set(x, 0, z);
          actor.path.shift();
          budget -= distance;
        } else {
          pos.x += (x - pos.x) / distance * budget;
          pos.z += (z - pos.z) / distance * budget;
          break;
        }
      }
      actor.it.x = pos.x;
      actor.it.z = pos.z;
      const distance = Math.hypot(pos.x - viewer.x, pos.z - viewer.z);
      if (actor.label) actor.label.visible = distance < 10;
      actor.person.setDoing(distance < 6 ? (occupied ? 'Helping you' : state.activity) : undefined);
      actor.person.holdMug(!moving && (state.activity.includes('lunch') || state.activity.includes('break')));
      actor.person.read(!moving && (state.activity.includes('Reading') || state.activity.includes('crossword')));
      // Quiet work has no speech bubbles; only the current speaker in a scene talks.
      this.say(actor, quiet || occupied || actor.path.length || distance > 10 ? '' : state.line ?? '');
      actor.person.setVoiceLevel(actor.line ? 0.07 + Math.sin(t * 15) * 0.035 : 0);
      actor.person.update(dt, t, moving, false);
    }
  }

  private say(actor: Actor, line: string) {
    if (actor.line === line) return;
    actor.line = line;
    if (actor.bubble) {
      actor.person.root.remove(actor.bubble);
      disposeSprite(actor.bubble);
      actor.bubble = undefined;
    }
    if (!line) return;
    const bubble = textSprite(line, { bg: '#fff9e9', size: 28 });
    bubble.position.y = actor.person.bubbleY + 0.18;
    bubble.scale.multiplyScalar(Math.min(1, 6 / bubble.scale.x));
    actor.person.root.add(bubble);
    actor.bubble = bubble;
  }
}
