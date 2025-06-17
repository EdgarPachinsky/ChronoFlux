import {Particle} from "../classes/Particle";

export interface IPulse {
  id: string
  x: number
  y: number
  maxRadius: number
  power: number
  color: string
  duration: number // ms
  currentTime: number; // how long it’s been running
  // applyOn: Particle[] | '*'
}

