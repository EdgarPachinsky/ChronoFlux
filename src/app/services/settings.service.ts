import {ElementRef, Injectable} from '@angular/core';
import {IParticle} from "../models/particle.model";
import {CanvasService} from "./canvas.service";
import {Particle} from "../classes/Particle";
import {FormControl, Validators} from "@angular/forms";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Vector} from "../classes/Vector";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  public counter = 1;
  public particles: Particle[]= [];

  public particleRadiusControl = new FormControl(15, [Validators.min(10)])
  public particleMassControl = new FormControl(1000, [Validators.min(10)])
  public particleMassUnitControl = new FormControl('KG', [])
  public particleMassUnits = ['KG', 'G']

  public deltaTimeControl = new FormControl( 0.046, [])
  public surfaceElasticityControl = new FormControl( 0.9, [])
  public particleColorControl = new FormControl('#000000', [])

  public windForceColorControl = new FormControl('#ffffff', [])
  public gravityColorControl = new FormControl('#ff0000', [])
  public airResistanceColorControl = new FormControl('#77d6ff', [])
  public totalForceColorControl = new FormControl('#00796b', [])

  public isShiftKeyPressed: boolean = false;

  public get newParticleRadius () {
    return Number(this.particleRadiusControl.value)
  }

  constructor(
    public canvasService: CanvasService,
    public matSnackBar: MatSnackBar,
  ) { }

  initializeCanvas(
    canvasContext: CanvasRenderingContext2D,
    canvasHTMLRef: ElementRef<HTMLCanvasElement>
  ){
    this.canvasService.canvasContext = canvasContext;
    this.canvasService.canvasHTMLRef = canvasHTMLRef;
  }

  findParticle(x: number, y: number, extraDistance: number = 0) {
    for (const particle of this.particles) {
      const dx = x - particle.x;
      const dy = y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= (particle.radius + extraDistance)) {
        return particle;
      }
    }
    return null;
  }

  handleCanvasClick(
      event: MouseEvent | undefined = undefined,
      pointsFromRandomGenerator: IParticle | undefined = undefined
    ){
    if(!event){
      return;
    }
    if(!this.particleMassControl.valid){
      this.matSnackBar.open('Mass in not set to proper value');
      return;
    }
    if(!this.particleRadiusControl.valid){
      this.matSnackBar.open('Radius in not set to proper value');
      return;
    }


    const rect = this.canvasService.canvasHTMLRef.nativeElement.getBoundingClientRect();
    const scaleX = this.canvasService.canvasHTMLRef.nativeElement.width / rect.width;
    const scaleY = this.canvasService.canvasHTMLRef.nativeElement.height / rect.height;

    // Calculate X coordinate relative to canvas's internal drawing surface
    const xRelative = (event.clientX - rect.left) * scaleX;
    // Calculate Y coordinate relative to canvas's internal drawing surface
    const yRelative = (event.clientY - rect.top) * scaleY;

    let onParticle = this.findParticle(xRelative, yRelative);

    if(this.isShiftKeyPressed && onParticle){
      this.particles = this.particles.filter((particle) => particle.id !== onParticle.id);
      this.saveToLocalStorage();
      this.canvasService.drawParticlesOnCanvas(this.particles);
      return;
    }

    const newParticle = new Particle(
        this.counter,
        xRelative,
        yRelative ,
        this.newParticleRadius,
        Number(this.particleMassControl.value),
        String(this.particleMassUnitControl.value),
        {name: '', description: ''},
        String(this.particleColorControl.value)
      )

    let overlappingWith = this.canvasService.getOverlappingParticles(newParticle, this.particles).overlappingWith;
    if(overlappingWith.length){
      // this  will reset particles error high light
      setTimeout(() => {
        this.particles = this.particles.map((particle) => { particle.highLightError = false; return particle })
        this.canvasService.drawParticlesOnCanvas(this.particles)
      },100)
    }else{
      console.log(`No Overlap`)

      this.particles.push(
        newParticle
      )

      this.counter = this.counter + 1;
    }

    this.saveToLocalStorage();
    this.canvasService.drawParticlesOnCanvas(this.particles);
  }

  clearAllParticles(){
    this.counter = 1;
    this.particles = [];
    this.saveToLocalStorage();
    this.canvasService.drawParticlesOnCanvas([])
  }

  loadLocalParticlesAndDraw(){
    let localParticles = localStorage.getItem('particles');
    if(localParticles){
      this.particles = JSON.parse(localParticles);
      this.particles = this.particles.map((particle) => {
        return new Particle(particle.id, particle.x, particle.y, particle.radius, particle.mass, particle.massUnit, particle.category, particle.color)
      })

      this.canvasService.drawParticlesOnCanvas(this.particles)
      this.counter = this.particles.length + 1;
    }
  }

  saveToLocalStorage(){
    localStorage.setItem('particles', JSON.stringify(this.particles));
  }

  setVisibilityForForce(particle: Particle, force: Vector){

  }

  getSurfaceElasticityLabel(value: number){

    if(value === 1){
      return 'No Energy Loss'
    }if(value >= 0.9 && value <= 0.99){
      return 'Very Elastic';
    } else if(value >= 0.7 && value < 0.9){
      return 'Slight bounce'
    }else if(value >= 0.6 && value < 0.7){
      return 'Soft surface'
    }else if(value >= 0.2 && value < 0.6){
      return 'Very squishy'
    }else if(value >= 0.1 && value < 0.2){
      return 'Almost stop'
    }else
      return 'Dead stop'
  }

  showLabelDeltaTime(value: number): string {
    if (value === 0.016) return 'Real-time (1x)';
    if (value < 0.016) return `Slow-motion (${(0.016 / value).toFixed(1)}x slower)`;
    return `Faster (${(value / 0.016).toFixed(1)}x speed)`;
  }
}
