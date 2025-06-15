import { Injectable } from '@angular/core';
import {Particle} from "../classes/Particle";
import {Vector} from "../classes/Vector";
import {CanvasService} from "./canvas.service";
import {BOARD_CONSTANTS} from "../constants/board.constant";
import {SettingsService} from "./settings.service";
import {CollisionService} from "./collision.service";

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
  ){

    if(this.isGravityActive){
      return
    }

    this.startAnimation(
      particles
    );
  }

  isRestingOnFloor(particle: Particle): boolean {
    const onFloor = particle.y + particle.radius >= BOARD_CONSTANTS.height;

    const lowVelocity = Math.abs(particle.vy) < 0.1; // or < 0.1
    const lowHorizontalVelocity = Math.abs(particle.vx) < 0.1;

    return onFloor && lowVelocity && lowHorizontalVelocity;
  }

  startAnimation(particles: Particle[],) {
    this.isGravityActive = true;
    this.isPlaying = true;
    this.isPaused = false;

    this.iteration = this.pausedIterator; // Initialize from paused iterator

    const animateLayout = () => {

      this.iteration++; // Update iteration
      this.pausedIterator = this.iteration; // Update paused iterator

      particles.forEach((particle: Particle) => {
        let otherParticles = particles.filter((_particle: Particle) => _particle.id !== particle.id)

        let windForce = new Vector(5000, -5000, String(this.settingsService.windForceColorControl.value), 'F Wind');
        let particleMass = particle.massUnit !== 'KG' ? particle.mass / 1000: particle.mass;
        let gravityForce = new Vector(0, 9.8 * particleMass, String(this.settingsService.gravityColorControl.value), 'F Gravity')

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

        let dragForce = new Vector(dragX, dragY, String(this.settingsService.airResistanceColorControl.value), 'F Air Resistance');

        this.collisionService.checkAndResolveCollision(particle, otherParticles)

        let totalForce = new Vector(
          dragForce.x + gravityForce.x + windForce.x,
          dragForce.y + gravityForce.y + windForce.y,
          String(this.settingsService.totalForceColorControl.value), 'F Total Force'
        )

        particle.forceVectors = [
          gravityForce,
          dragForce,
          windForce,
          totalForce,
        ]

        const ax = totalForce.x / particleMass;
        const ay = totalForce.y / particleMass;

        // 2. Update particle's velocity based on acceleration and time step
        particle.vx += ax * Number(this.settingsService.deltaTimeControl.value);
        particle.vy += ay * Number(this.settingsService.deltaTimeControl.value);

        // 3. Update particle's position based on new velocity and time step
        particle.x += particle.vx * Number(this.settingsService.deltaTimeControl.value);
        particle.y += particle.vy * Number(this.settingsService.deltaTimeControl.value);

        // if (this.isRestingOnFloor(particle)) {
        //   particle.vx = 0;
        //   particle.vy = 0;
        //
        //   // Optional: stop gravity or mark as "rested"
        //   particle.isAtRest = true;
        //   return; // skip this particle
        // }

        this.settingsService.particlePositionFix(particle);
      })
      this.canvasService.drawParticlesOnCanvas(particles);

      this.animationId = requestAnimationFrame(animateLayout);
    };

    this.animationId = requestAnimationFrame(animateLayout);
  }


  pauseGravityAnimation() {
    this.isGravityActive = false;
    this.isPlaying = false;
    this.isPaused = true; // Set the pause flag
    cancelAnimationFrame(this.animationId!); // Stop the current animation frame
  }
}
