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

  intervalMap: Map<string, any> = new Map();
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

    this.setIntervalEvents()

    this.startAnimation(
      particles,
      pulsePoints
    );
  }

  setIntervalEvents(){
    let intervalPulses = this.settingsService.pulsePoints.filter((pulse) => pulse.pulseInterval && pulse.pulseInterval > 500 && pulse.isActive);
    if(intervalPulses && intervalPulses.length){
      for (const pulse of intervalPulses) {
        // Avoid double interval setting
        if (this.intervalMap.has(pulse.id)) continue;

        const intervalId = setInterval(() => {
          // Perform the action for the pulse
          // this.triggerPulse(pulse);
          this.canvasService.pulsePointsQueue.push(pulse)
        }, pulse.pulseInterval);

        this.intervalMap.set(pulse.id, intervalId);
      }
    }
  }

  isRestingOnFloor(particle: Particle): boolean {
    const onFloor = particle.y + particle.radius >= BOARD_CONSTANTS.height;

    const lowVelocity = Math.abs(particle.vy) < 0.1; // or < 0.1
    const lowHorizontalVelocity = Math.abs(particle.vx) < 0.1;

    return onFloor && lowVelocity && lowHorizontalVelocity;
  }

  initializeTangentialVelocity(dx:number, dy:number, r:number, asPlanet:Particle, particle:Particle){
    let tangentialSpeed = Math.sqrt(asPlanet?.gravitationalConstant * asPlanet?.convertedMass / r); // Circular orbit speed

    particle.vx = -dy / r * tangentialSpeed;
    particle.vy = dx / r * tangentialSpeed;
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
        // first get other particles in case if we will need to calculate impact of forces in other ones
        let otherParticles = particles.filter((_particle: Particle) => _particle.id !== particle.id)
        // initialize default two forces as null
        let gravityForce:Vector | null = null;
        let airResistanceForce:Vector | null = null;

        // initialize plants gravitational force
        let planetGravitationalForce: Vector | null = null;

        // space simulation module
        if(this.settingsService.isSpaceSimulationModeControl.value){
          // check if current particle exists in planets array
          let asPlanet:Particle | undefined = this.settingsService.planets.find((planet) => planet.id === particle.id)
          // if yes
          if(asPlanet){
            otherParticles.forEach(otherParticle => {
              // calculate distance between
              let dx = particle?.x - otherParticle.x;
              let dy = particle?.y - otherParticle.y;
              let r = Math.sqrt(dx * dx + dy * dy);
              // calculate gravitational force
              let force = asPlanet?.gravitationalConstant * asPlanet?.convertedMass * otherParticle.convertedMass / (r * r);
              // initialize force vector
              planetGravitationalForce = new Vector(
                'gravitational',
                (dx / r) * force,
                (dy / r) * force,
                '#ffcc00',
                'Gravitational Force'
              );
              // calculate impact vx and vy
              otherParticle.vx += planetGravitationalForce.x / otherParticle.convertedMass;
              otherParticle.vy += planetGravitationalForce.y / otherParticle.convertedMass;

              // add in forces array
              otherParticle.forceVectors = [planetGravitationalForce]
              // calculate Tangential Velocity to keep planet in orbit
              this.initializeTangentialVelocity(dx, dy, r, asPlanet, otherParticle)
            })
          }
        }
        // if not in space simulation mode , then get gravity and air resistance force vectors
        else{

          // if default gravity force is activated
          if(this.settingsService.gravityStatusControl.value)
            gravityForce = this.getGravityForce(particle);

          // if default air resistance force is activated
          if(this.settingsService.airResistanceStatusControl.value)
            airResistanceForce = this.getAirResistanceForce(particle);
        }


        let pulseImpactForcesExists:Vector[] = particle.forceVectors.filter((force: Vector) => force.id.startsWith('pulseImpact'));

        let defaultForceVectors:Array<Vector | null> = [gravityForce, airResistanceForce];

        let { defaultForcesXSum, defaultForcesYSum } = this.getAllDefaultForcesXYComponentSum(defaultForceVectors);
        let { customForcesXSum, customForcesYSum } = this.getAllCustomForcesXYComponentSum(pulseImpactForcesExists || []);

        let planetGravitationalForceExists:Vector | undefined = particle.forceVectors.find((force: Vector) => force.id === 'gravitational');

        let totalForce = new Vector(
          'total',
          defaultForcesXSum + customForcesXSum + (planetGravitationalForceExists?.x || 0),
          defaultForcesYSum + customForcesYSum + (planetGravitationalForceExists?.y || 0),
          String(this.settingsService.totalForceColorControl.value),
          'F Total Force'
        )

        particle.forceVectors = [
          ...defaultForceVectors.filter((v): v is Vector => v !== null),
          ...(pulseImpactForcesExists.length > 0) ? [...pulseImpactForcesExists]: [],
          ...planetGravitationalForceExists ? [planetGravitationalForceExists]: [],
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

        particle.speed = this.getParticleSpeed(particle)

        this.collisionService.checkAndResolveCollision(particle, otherParticles);

        if(!this.settingsService.isSpaceSimulationModeControl.value)
          this.settingsService.particlePositionFixCloseToBorders(particle);
      })
      this.canvasService.drawParticlesOnCanvas(particles, this.settingsService.pulsePoints);
      // this.canvasService.drawRipples(particles)
      this.animationId = requestAnimationFrame(animateLayout);
    };

    this.animationId = requestAnimationFrame(animateLayout);
  }

  getAllCustomForcesXYComponentSum(additionalForces: Vector[] = []){
    let customForcesXSum = 0;
    let customForcesYSum = 0;

    let allForces = [...additionalForces, ...this.settingsService.customForces]

    allForces.forEach((customForce) => {
      if(!customForce.isActive){
        return
      }

      customForcesXSum += customForce.x;
      customForcesYSum += customForce.y;
    })

    return {customForcesXSum, customForcesYSum}
  }

  getAllDefaultForcesXYComponentSum(
    defaultForces: Array<Vector | null>
  ){
    let defaultForcesXSum = 0;
    let defaultForcesYSum = 0;



    defaultForces.forEach((force: Vector | null) => {
      if(!force){
        return
      }

      defaultForcesXSum += force.x;
      defaultForcesYSum += force.y;
    })

    return {defaultForcesXSum, defaultForcesYSum}
  }

  getAllCustomForces(){
    return this.settingsService.customForces.filter((customForce:Vector) => customForce.isActive) || []
  }


  getGravityForce(particle:Particle){
    return new Vector('gravity',0, 9.8 * particle.convertedMass, String(this.settingsService.gravityColorControl.value), 'F Gravity')
  }

  getAirResistanceForce(particle:Particle){
    // Using quadratic drag: F_drag_magnitude = k * speed^2
    let dragMagnitude = 2 * Math.pow(particle.speed, 2);
    let dragX = 0;
    let dragY = 0;
    if(particle.speed > 0){
      dragX = -dragMagnitude * (particle.vx / particle.speed);
      dragY = -dragMagnitude * (particle.vy / particle.speed);
    }

    return new Vector('air_resistance', dragX, dragY, String(this.settingsService.airResistanceColorControl.value), 'F Air Resistance');
  }

  getParticleSpeed(particle: Particle){
    return Math.sqrt( Math.pow(particle.vx, 2) + Math.pow(particle.vy, 2) )
  }

  pauseGravityAnimation() {
    this.isGravityActive = false;
    this.isPlaying = false;
    this.isPaused = true; // Set the pause flag
    cancelAnimationFrame(this.animationId!); // Stop the current animation frame
  }
}
