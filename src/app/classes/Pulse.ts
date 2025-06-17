import {IPulse} from "../models/pulse.model";
import {Particle} from "./Particle";
import {SharedFunctional} from "./Shared-Functional";

export class Pulse extends SharedFunctional implements IPulse{
  public id: string
  public x: number
  public y: number
  public maxRadius!: number
  public power!: number
  public color!: string
  public duration!: number // ms
  public currentTime!: number; // how long it’s been running
  // public applyOn!: Particle[] | '*'
  public isActive: boolean = false;
  public isCompleted: boolean = false;

  constructor(
    id = '', x: number = 0, y: number = 0, maxRadius = 0, power = 0,
    color = '', duration = 0, currentTime = 0 , isActive = false
  ) {
    super();
    this.id = id || this.generateSecureId(10);
    this.x = x;
    this.y = y;
    this.maxRadius = maxRadius;
    this.power = power;
    this.color = color;
    this.duration = duration;
    this.currentTime = currentTime;
    // this.applyOn = applyOn;
    this.isActive = isActive;
  }
}
