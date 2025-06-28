import {ElementRef, Injectable} from '@angular/core';
import {Particle} from "../classes/Particle";
import {OverlapInfo} from "../models/overlap.model";
import {BOARD_CONSTANTS} from "../constants/board.constant";
import {Pulse} from "../classes/Pulse";
import {Vector} from "../classes/Vector";

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

  drawPulsePoint(pulse: Pulse, radius: number = 3) {
    const ctx = this.canvasContext;

    ctx.save();

    // 1. Outer glow effect (soft ring)
    const glow = ctx.createRadialGradient(pulse.x, pulse.y, 0, pulse.x, pulse.y, radius * 4);
    glow.addColorStop(0, pulse.color);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, radius * 3, 0, 2 * Math.PI);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.closePath();

    // 2. Main point (core)
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = pulse.color;
    ctx.shadowColor = pulse.color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.closePath();

    // 3. Optional ring around the core
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, radius + 1.5, 0, 2 * Math.PI);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.closePath();

    // 4. Optional "Temp" text (if temporary)
    if (pulse.isTemporary) {
      ctx.font = "10px Arial";
      ctx.fillStyle = "white";
      ctx.fillText("Temp", pulse.x + radius + 5, pulse.y + 3);
    }

    ctx.restore();
  }

  drawRipples(particles: Particle[]) {
    const ctx = this.canvasContext;

    particles.forEach(particle => {
      if (particle.type === 'blackHole') {

        particle.rippleTime = (particle.rippleTime ?? 0) + 1;

        const maxRipples = 3;
        const rippleSpacing = 5;
        const rippleLife = 150;

        for (let i = 0; i < maxRipples; i++) {
          const progress = (particle.rippleTime - i * rippleSpacing) % rippleLife;
          if (progress < 0) continue;

          const alpha = 1 - progress / rippleLife;
          const radius = particle.radius + progress;

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`; // golden ripple
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.closePath();
        }
      }
    });
  }

  public drawParticlesOnCanvas(
    particles: Particle[],
    pulsePoints: Pulse[] = []
  ){
    this.clearCanvas();

    // explosion part
    this.pulsePointsQueue.forEach((pulse) => {
      // check if pulse is active
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

        // means if particle is in impact zone
        if (dist < radius) {

          const force = (pulse.power * (1 - dist / radius)) / p.mass;

          let impactVector = p.forceVectors.find((vector) => vector.id === `pulseImpact_${pulse.id}`)

          if(impactVector){
            impactVector.x = (dx / dist) * force
            impactVector.y = (dy / dist) * force
          }else{
            impactVector = new Vector(
              `pulseImpact_${pulse.id}`,
              (dx / dist) * force,
              (dy / dist) * force,
              pulse.color,
              `Pulse Impact`
            )

            p.forceVectors.push(impactVector)
          }

          p.vx += impactVector.x;
          p.vy += impactVector.y;
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
      this.drawPulsePoint(pulse)
    })

    particles.forEach((particle: Particle) => {
      const ctx = this.canvasContext;

      switch (particle.type){
        case "regular":
          this.drawRegularParticle(particle);
          break;
        case "blackHole":
          this.drawBlackHole(particle);
          break;
        case "star":
          this.drawStar(particle);
          break;
        case "planet":
          this.drawPlanet(particle);
          break;
      }

      // Draw ID (white, centered)
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      const fixPixelX = String(particle.id).length === 2 ? 5 : 3;
      const fixPixelY = 3;
      ctx.fillText(String(particle.id), particle.x - fixPixelX, particle.y + fixPixelY);
    });
  }

  drawBlackHole(particle: Particle) {
    const ctx = this.canvasContext;
    const radius = particle.radius;
    const x = particle.x;
    const y = particle.y;

    // Rotate angle for swirling effect
    particle.rotation = particle.rotation || (Math.random() + 10);
    particle.rotation += 0.01; // Control the speed

    // Save context state
    ctx.save();

    // Move to center and rotate
    ctx.translate(x, y);
    ctx.rotate(particle.rotation);

    const swirlCount = 100;
    const layerCount = 10;

    for (let j = 0; j < layerCount; j++) {
      const layerOffset = j * 2; // Push each layer further out
      const angleOffset = particle.rotation + j * 0.1; // Small swirl per layer

      for (let i = 0; i < swirlCount; i++) {
        const angle = -(i / swirlCount) * 2 * Math.PI + angleOffset;

        // Gradient for glow effect
        const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius * 2.5);
        grad.addColorStop(0, 'rgba(255, 140, 0, 0.3)');
        grad.addColorStop(1, 'rgba(255, 69, 0, 0)');

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        const arcRadius = radius * 1.5 + i * 0.8 + layerOffset;
        ctx.arc(0, 0, arcRadius, angle, angle + Math.PI / 10);
        ctx.stroke();
        ctx.closePath();
      }
    }

    ctx.restore(); // Restore to avoid affecting other particles


    // === Faint gravitational halo ===
    const halo = ctx.createRadialGradient(x, y, radius * 1.3, x, y, radius * 2.5);
    halo.addColorStop(0, 'rgba(255, 140, 0, 0.2)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = halo;
    ctx.fill();
    ctx.closePath();

    // === Black core ===
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    coreGradient.addColorStop(0, 'black');
    coreGradient.addColorStop(1, 'rgba(0,0,0,0.8)');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    ctx.closePath();


    // Optional: Stroke gold ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }


  drawRegularParticle(particle: Particle){
    const ctx = this.canvasContext;

    // Normal particle
    ctx.beginPath();
    ctx.fillStyle = particle.highLightError ? 'red' : particle.color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawPlanet(particle: Particle) {
    const ctx = this.canvasContext;
    const isGas = particle.planetSubType === 'gas';
    const radius = particle.radius;

    const baseColor = particle.color || '#6699ff';

    const brightenColor = (hex: string, amount: number = 30) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.min(255, ((num >> 16) & 255) + amount);
      const g = Math.min(255, ((num >> 8) & 255) + amount);
      const b = Math.min(255, (num & 255) + amount);
      return `rgb(${r},${g},${b})`;
    };

    const strokeColor = brightenColor(baseColor, 40);

    // === Saturn-style Rings ===
    console.log(`particle.planetHasRings`)
    console.log(particle.planetHasRings)
    if (particle.planetHasRings) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(Math.PI / 6); // Tilt the ring (optional)

      const ringCount = 3;
      for (let i = 0; i < ringCount; i++) {
        const ringWidth = radius * 0.3 + i * 2;
        ctx.beginPath();
        ctx.ellipse(
          0, 0,
          radius * 1.4 + i * 4,  // x-radius
          radius * 0.4 + i,      // y-radius
          0, 0, Math.PI * 2
        );
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 - i * 0.05})`; // subtle fading
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.closePath();
      }
      ctx.restore();
    }

    // === Planet body ===
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();

    // === Shadow / depth ===
    const shadowGradient = ctx.createRadialGradient(
      particle.x - radius * 0.5, particle.y - radius * 0.5, radius * 0.2,
      particle.x, particle.y, radius
    );
    shadowGradient.addColorStop(0, 'rgba(0,0,0,0)');
    shadowGradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = shadowGradient;
    ctx.fill();
    ctx.closePath();

    // === Gas Particle Effect ===
    if (isGas) {
      const particleCount = 80;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const dist = Math.random() * radius * 1.2;
        const px = particle.x + Math.cos(angle) * dist;
        const py = particle.y + Math.sin(angle) * dist;

        ctx.beginPath();
        ctx.arc(px, py, Math.random() * 1.8 + 0.5, 0, 2 * Math.PI);
        const opacity = dist < radius
          ? Math.random() * 0.3 + 0.1
          : Math.random() * 0.15 + 0.05;
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
        ctx.closePath();
      }
    }
  }


  drawStar(particle: Particle) {
    const ctx = this.canvasContext;

    // === Step 1: Handle subtle pulse phase ===
    if (particle.pulsePhase === undefined) particle.pulsePhase = 0;
    particle.pulsePhase += 0.009; // Very slow pulse

    const pulse = 1 + Math.sin(particle.pulsePhase) * 0.03; // Very slight growth
    const radius = particle.radius;
    const x = particle.x;
    const y = particle.y;

    const baseColor = particle.color || '#ffaa00';

    // Helper to convert hex to RGBA
    const hexToRgba = (hex: string, alpha: number) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    for (let i = 0; i < 5; i++) {
      const flareAngle = Math.random() * 2 * Math.PI;
      const flareLength = radius * (1.5 + Math.random());
      const startRadius = radius * 1.1;

      ctx.beginPath();
      ctx.arc(x, y, startRadius + flareLength, flareAngle, flareAngle + 0.1);
      ctx.strokeStyle = `rgba(255, 200, 50, 0.2)`;
      ctx.lineWidth = 2 + Math.random();
      ctx.stroke();
      ctx.closePath();
    }

    // === Step 2: Pulsing sun glow
    const glowRadius = radius * 2.2 * pulse;
    const sunGlow = ctx.createRadialGradient(x, y, radius * 0.7, x, y, glowRadius);
    sunGlow.addColorStop(0, hexToRgba(baseColor, 0.5));
    sunGlow.addColorStop(0.5, hexToRgba(baseColor, 0.3));
    sunGlow.addColorStop(1, hexToRgba(baseColor, 0));

    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
    ctx.fillStyle = sunGlow;
    ctx.fill();
    ctx.closePath();

    // === Gravitational halo (faint outer effect)
    const halo = ctx.createRadialGradient(x, y, radius * 1.3, x, y, radius * 2.5);
    halo.addColorStop(0, hexToRgba(baseColor, 0.2));
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = halo;
    ctx.fill();
    ctx.closePath();

    // === Step 3: Sun core (stable)
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.strokeStyle = hexToRgba(baseColor, 0.8);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.closePath();
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
