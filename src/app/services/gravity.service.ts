import { Injectable } from '@angular/core';
import {Particle} from "../classes/Particle";
import {Vector} from "../classes/Vector";
import {CanvasService} from "./canvas.service";
import {BOARD_CONSTANTS} from "../constants/board.constant";
import {SettingsService} from "./settings.service";
import {CollisionService} from "./collision.service";
import {Pulse} from "../classes/Pulse";

@Injectable({
  providedIn: 'root'
})
export class GravityService {

  public EPSILON = 0.001;

  iteration: number = 0;
  pausedIterator: number = 0;

  animationId: number | null = null;
  isPaused: boolean = false;
  isPlaying: boolean = false;

  isGravityActive: boolean = false;


  constructor(
    public canvasService: CanvasService,
    public settingsService: SettingsService,
    public collisionService: CollisionService,
  ) { }

  activateGravity(
    particles: Particle[],
    pulsePoints: Pulse[] = [],
  ){

    if(this.isGravityActive){
      return
    }

    this.startAnimation(
      particles,
      pulsePoints
    );
  }

  isRestingOnFloor(particle: Particle): boolean {
    const onFloor = particle.y + particle.radius >= BOARD_CONSTANTS.height;

    const lowVelocity = Math.abs(particle.vy) < 0.1; // or < 0.1
    const lowHorizontalVelocity = Math.abs(particle.vx) < 0.1;

    return onFloor && lowVelocity && lowHorizontalVelocity;
  }

  startAnimation(particles: Particle[], pulsePoints: Pulse[] = []) {
    this.isGravityActive = true;
    this.isPlaying = true;
    this.isPaused = false;

    this.iteration = this.pausedIterator; // Initialize from paused iterator

    const animateLayout = () => {

      this.iteration++; // Update iteration
      this.pausedIterator = this.iteration; // Update paused iterator

      particles.forEach((particle: Particle) => {
        let otherParticles = particles.filter((_particle: Particle) => _particle.id !== particle.id)

        let windForce = this.getWindForce();
        let gravityForce = this.getGravityForce(particle);
        let airResistanceForce = this.getAirResistanceForce(particle)

        this.collisionService.checkAndResolveCollision(particle, otherParticles)

        let { customForcesXSum, customForcesYSum } = this.getAllCustomForcesXYComponentSum();
        let totalForce = new Vector(
          'total',

          (!!this.settingsService.airResistanceStatusControl.value?airResistanceForce.x:0) +
             (!!this.settingsService.gravityStatusControl.value?gravityForce.x:0) +
             (!!this.settingsService.windForceStatusControl.value?windForce.x:0) + customForcesXSum,

          (!!this.settingsService.airResistanceStatusControl.value?airResistanceForce.y:0) +
             (!!this.settingsService.gravityStatusControl.value?gravityForce.y:0) +
             (!!this.settingsService.windForceStatusControl.value?windForce.y:0) + customForcesYSum,

          String(this.settingsService.totalForceColorControl.value), 'F Total Force'
        )

        particle.forceVectors = [
          ...(!!this.settingsService.gravityStatusControl.value ? [gravityForce] : []),
          ...(!!this.settingsService.airResistanceStatusControl.value ? [airResistanceForce] : []),
          ...(!!this.settingsService.windForceStatusControl.value ? [windForce] : []),
          ...this.settingsService.customForces.length ? [...this.getAllCustomForces()] : [],
          totalForce,
        ]

        const ax = totalForce.x / particle.convertedMass;
        const ay = totalForce.y / particle.convertedMass;

        // 2. Update particle's velocity based on acceleration and time step
        particle.vx += ax * Number(this.settingsService.deltaTimeControl.value);
        particle.vy += ay * Number(this.settingsService.deltaTimeControl.value);

        // 3. Update particle's position based on new velocity and time step
        particle.x += particle.vx * Number(this.settingsService.deltaTimeControl.value);
        particle.y += particle.vy * Number(this.settingsService.deltaTimeControl.value);

        this.settingsService.particlePositionFix(particle);
      })
      this.canvasService.drawParticlesOnCanvas(particles, this.settingsService.pulsePoints);

      this.animationId = requestAnimationFrame(animateLayout);
    };

    this.animationId = requestAnimationFrame(animateLayout);
  }

  getAllCustomForcesXYComponentSum(){
    let customForcesXSum = 0;
    let customForcesYSum = 0;
    this.settingsService.customForces.forEach((customForce) => {
      if(!customForce.isActive){
        return
      }

      customForcesXSum += customForce.x;
      customForcesYSum += customForce.y;
    })

    return {customForcesXSum, customForcesYSum}
  }

  getAllCustomForces(){
    return this.settingsService.customForces.filter((customForce:Vector) => customForce.isActive) || []
  }

  getWindForce(){
    return new Vector('wind', 5000, -5000, String(this.settingsService.windForceColorControl.value), 'F Wind');
  }

  getGravityForce(particle:Particle){
    return new Vector('gravity',0, 9.8 * particle.convertedMass, String(this.settingsService.gravityColorControl.value), 'F Gravity')
  }

  getAirResistanceForce(particle:Particle){
    // particle speed magnitude of velocity vector
    let speed = Math.sqrt( Math.pow(particle.vx, 2) + Math.pow(particle.vy, 2) )
    particle.speed = speed;

    // Using quadratic drag: F_drag_magnitude = k * speed^2
    let dragMagnitude = 2 * Math.pow(speed, 2);
    let dragX = 0;
    let dragY = 0;
    if(speed > 0){
      dragX = -dragMagnitude * (particle.vx / speed);
      dragY = -dragMagnitude * (particle.vy / speed);
    }

    return new Vector('air_resistance', dragX, dragY, String(this.settingsService.airResistanceColorControl.value), 'F Air Resistance');
  }

  pauseGravityAnimation() {
    this.isGravityActive = false;
    this.isPlaying = false;
    this.isPaused = true; // Set the pause flag
    cancelAnimationFrame(this.animationId!); // Stop the current animation frame
  }
}
