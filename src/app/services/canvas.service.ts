import {ElementRef, Injectable} from '@angular/core';
import {Particle} from "../classes/Particle";
import {OverlapInfo} from "../models/overlap.model";
import {BOARD_CONSTANTS} from "../constants/board.constant";

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

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


  public drawParticlesOnCanvas(
    particles: Particle[],
  ){
    this.clearCanvas();
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
}
