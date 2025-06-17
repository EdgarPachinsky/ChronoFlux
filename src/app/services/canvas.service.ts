import {ElementRef, Injectable} from '@angular/core';
import {Particle} from "../classes/Particle";
import {OverlapInfo} from "../models/overlap.model";
import {BOARD_CONSTANTS} from "../constants/board.constant";
import {Pulse} from "../classes/Pulse";

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  public pulsePointsQueue: Pulse[] = [];

  private _canvasContext!: CanvasRenderingContext2D;
  private _canvasHTMLRef!: ElementRef<HTMLCanvasElement>;

  constructor() { }

  public set canvasContext(_canvasContext: CanvasRenderingContext2D){
    this._canvasContext = _canvasContext
  }
  public set canvasHTMLRef(_canvasHTMLRef: ElementRef<HTMLCanvasElement>){
    this._canvasHTMLRef = _canvasHTMLRef
  }

  public get canvasContext(){
    return this._canvasContext
  }
  public get canvasHTMLRef(){
    return this._canvasHTMLRef
  }

  private clearCanvas(){
    this.canvasContext.clearRect(0, 0, BOARD_CONSTANTS.width, BOARD_CONSTANTS.height);
    this.canvasContext.save(); // Save current context state
  }

  pointInPulsePoints(pulsePoint:Pulse){
    return this.pulsePointsQueue.find((el:Pulse) => el.id === pulsePoint.id);
  }

  drawExplosionCircle(x: number, y: number, radius: number, alpha: number, hexColor: string = "#ff6400") {
    const rgba = this.hexToRgba(hexColor, alpha);

    this.canvasContext.save();
    this.canvasContext.beginPath();
    this.canvasContext.arc(x, y, radius, 0, 2 * Math.PI);
    this.canvasContext.strokeStyle = rgba;
    this.canvasContext.lineWidth = 2;
    this.canvasContext.stroke();
    this.canvasContext.restore();
  }

  drawPulsePoint(x: number, y: number, color: string = "#ff0000", radius: number = 3) {
    this.canvasContext.save();
    this.canvasContext.beginPath();
    this.canvasContext.arc(x, y, radius, 0, 2 * Math.PI);
    this.canvasContext.fillStyle = color;
    this.canvasContext.fill();
    this.canvasContext.restore();
  }

  public drawParticlesOnCanvas(
    particles: Particle[],
    pulsePoints: Pulse[] = []
  ){
    this.clearCanvas();

    // explosion part
    this.pulsePointsQueue.forEach((pulse) => {
      if(!pulse.isActive){
        return
      }

      pulse.isCompleted = false;
      pulse.currentTime += Number(1.2);

      const progress = pulse.currentTime / pulse.duration;
      const radius = pulse.maxRadius * progress;

      // Apply force to particles within radius
      for (const p of particles) {
        const dx = p.x - pulse.x;
        const dy = p.y - pulse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < radius) {
          const force = (pulse.power * (1 - dist / radius)) / p.mass;
          const nx = dx / dist;
          const ny = dy / dist;

          p.vx += nx * force;
          p.vy += ny * force;
        }
      }

      if(radius > pulse.maxRadius){
        pulse.isCompleted = true;
        pulse.currentTime = 0;
        // pulse.isActive = false;

        this.pulsePointsQueue = this.pulsePointsQueue.filter(p => p.id !== pulse.id);
      }else{
        this.drawExplosionCircle(pulse.x, pulse.y, radius, 1 - progress, pulse.color)
      }
    })

    pulsePoints.forEach((pulse) => {
      if(!pulse.isActive){
        return
      }
      this.drawPulsePoint(pulse.x, pulse.y, pulse.color)
    })

    particles.forEach((particle: Particle) => {
      this.canvasContext.beginPath();
      // Set the fill color for the circle.
      // This color will be used when ctx.fill() is called.
      this.canvasContext.fillStyle = particle.highLightError ? 'red': particle.color;
      // Set the stroke (outline) color for the circle.
      // This color will be used when ctx.stroke() is called.
      this.canvasContext.strokeStyle = 'white';
      // Set the width of the stroke (outline) for the particle.
      this.canvasContext.lineWidth = 1; // Set this *before* ctx.stroke() for the particle
      // Draw an arc (part of a circle or a full circle).
      // Parameters: (x, y, radius, startAngle, endAngle, anticlockwise)
      // - x, y: Coordinates of the circle's center (150, 150 is the center of a 300x300 canvas).
      // - radius: The radius of the circle (50 pixels).
      // - startAngle: Starting angle in radians (0 for the rightmost point).
      // - endAngle: Ending angle in radians (2 * Math.PI for a full circle, which is 360 degrees).
      // - anticlockwise: A boolean (false for clockwise, true for counter-clockwise).
      this.canvasContext.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        2 * Math.PI
      )
      // Close the path to ensure the circle is fully defined
      this.canvasContext.closePath();
      // Fill the current path (the circle) with the specified fillStyle.
      this.canvasContext.fill();
      // Draw the outline of the current path (the circle) with the set strokeStyle and lineWidth.
      this.canvasContext.stroke();
      // TODO: dynamically change color of
      let fixPixelX = String(particle.id).length === 2 ? 5: 3;
      let fixPixelY =  3;
      this.canvasContext.strokeText(String(particle.id), particle.x - fixPixelX, particle.y + fixPixelY,)
    })
  }

  public getOverlappingParticles(
    newParticle: Particle,
    allParticlesBefore: Particle[] = [],
  ): OverlapInfo {

    let overlappingWith: Particle[] = [];

    if(!allParticlesBefore.length){
      return { overlappingWith }
    }

    for (let i = 0; i < allParticlesBefore.length; i++) {

      let minimumDistanceTillOverlap = newParticle.radius + allParticlesBefore[i].radius;

      let distance = Math.sqrt(
          Math.pow(( allParticlesBefore[i].x - newParticle.x ),2) +
          Math.pow(( allParticlesBefore[i].y - newParticle.y ),2)
        )

      if(distance < minimumDistanceTillOverlap){
        allParticlesBefore[i].highLightError = true;

        overlappingWith.push(
          allParticlesBefore[i]
        )
      }
    }

    return { overlappingWith };
  }

  hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Expand shorthand (e.g. "#f60")
    if (hex.length === 3) {
      hex = hex.split("").map(c => c + c).join("");
    }

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
