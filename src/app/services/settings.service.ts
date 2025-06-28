import { ElementRef, Injectable } from '@angular/core';
import {IParticle} from "../models/particle.model";
import {CanvasService} from "./canvas.service";
import {Particle} from "../classes/Particle";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Vector} from "../classes/Vector";
import {CollisionService} from "./collision.service";
import {BOARD_CONSTANTS} from "../constants/board.constant";
import {Pulse} from "../classes/Pulse";
import {Subscription} from "rxjs";
import {SoundsService} from "./sounds.service";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public $subscriptions = new Subscription();

  public counter = 1;
  public particles: Particle[] = [];
  public customForces: Vector[] = [];
  public pulsePoints: Pulse[] = [];


  public isSpaceSimulationModeControl = new FormControl(false, [])

  public particleRadiusControl = new FormControl(15, [Validators.min(10)])
  public particleMassControl = new FormControl(1000, [Validators.min(10)])
  public particleMassUnitControl = new FormControl('kg', [])
  public particleIsBlackHoleControl = new FormControl(false, [])
  public particleIsStarControl = new FormControl(false, [])
  public particleIsPlanetControl = new FormControl(false, [])
  public particleIsPlanetGasSubtypeControl = new FormControl(false, [])
  public particleIsPlanetHasCirclesControl = new FormControl(false, [])
  // public particleIsPlanetRockSubtypeControl = new FormControl(true, [])

  public particleMassUnits = ['kg', 'g']

  public deltaTimeControl = new FormControl( 0.046, [])
  public surfaceElasticityControl = new FormControl( 0.9, [])
  public particleColorControl = new FormControl('#000000', [])

  public windForceColorControl = new FormControl('#ffffff', [])
  public windForceStatusControl = new FormControl(false, [])
  public gravityColorControl = new FormControl('#ff0000', [])
  public gravityStatusControl = new FormControl(true, [])
  public airResistanceColorControl = new FormControl('#77d6ff', [])
  public airResistanceStatusControl = new FormControl(true, [])
  public totalForceColorControl = new FormControl('#00796b', [])

  public customForceXControl = new FormControl(0, [Validators.required]);
  public customForceYControl = new FormControl(0, [Validators.required]);
  public customForceColorControl = new FormControl('#1b00ff', []);
  public customForceNameControl = new FormControl('', [Validators.required]);

  public customForceForm = new FormGroup(
    {
      'x': this.customForceXControl,
      'y': this.customForceYControl,
      'color': this.customForceColorControl,
      'name': this.customForceNameControl,
    }
  )
  public temporaryVector =
    new Vector('',
      Number(this.customForceXControl.value),
      Number(this.customForceYControl.value),
      String(this.customForceColorControl.value),
      String(this.customForceNameControl.value)
    )

  public isIsInPulsePointAddMode = new FormControl(false, [Validators.required]);
  public pulseIdControl = new FormControl('', [Validators.required]);
  public pulseXControl = new FormControl(0, [Validators.required]);
  public pulseYControl = new FormControl(0, [Validators.required]);
  public pulseMaxRadiusControl = new FormControl(0, [Validators.required]);
  public pulsePowerControl = new FormControl(0, [Validators.required]);
  public pulseColorControl = new FormControl('#ff0000', [Validators.required]);
  public pulseDurationControl = new FormControl(0, [Validators.required]);
  public pulseIntervalControl = new FormControl(0, []);
  // public pulseApplyOnControl = new FormControl([], [Validators.required]);

  public customPulseForm = new FormGroup(
    {
      'x': this.pulseXControl,
      'y': this.pulseYControl,
      'maxRadius': this.pulseMaxRadiusControl,
      'power': this.pulsePowerControl,
      'color': this.pulseColorControl,
      'duration': this.pulseDurationControl,
      'interval': this.pulseIntervalControl,
      // 'applyOn': this.pulseApplyOnControl,
    }
  )
  public temporaryPulsePoint! : Pulse | undefined;

  public planets: Particle[] = [];
  public planetsControl = new FormControl([], [Validators.required]);

  public isShiftKeyPressed: boolean = false;

  public replacingParticle:Particle | undefined = undefined;
  public draggingX!: number
  public draggingY!: number

  public showMassChangeInputForParticle:{[key: number]: { show: boolean, originalValue: any, newValue: any , massUnit: 'kg' | 'g'}} = {}
  public showRadiusChangeInputForParticle:{[key: number]: { show: boolean, originalValue: any, newValue: any}} = {}

  public get newParticleRadius () {
    return Number(this.particleRadiusControl.value)
  }

  constructor(
    public collisionService: CollisionService,
    public canvasService: CanvasService,
    public matSnackBar: MatSnackBar,
    public soundsService: SoundsService,
  ) {

  }

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

  handleCanvasMouseMove(event: MouseEvent) {
    if(!this.replacingParticle){
      return;
    }

    const { xRelative, yRelative } = this.findRelativeXY(event)

    this.draggingX = xRelative;
    this.draggingY = yRelative;

    this.replacingParticle.x = this.draggingX;
    this.replacingParticle.y = this.draggingY;

    if(!this.isSpaceSimulationModeControl.value)
      this.particlePositionFixCloseToBorders(this.replacingParticle)


    this.particles.forEach((particle) => {
      this.collisionService.checkAndResolveCollision(particle, this.particles)
    })

    this.canvasService.drawParticlesOnCanvas(this.particles, this.pulsePoints)
    this.saveToLocalStorage();
  }

  handleCanvasMouseUp(
    event: MouseEvent | undefined = undefined,
  ){
    if(this.replacingParticle){
      setTimeout(() => {
        this.replacingParticle = undefined;
      },100)
    }
  }

  handleCanvasMouseDown(
    event: MouseEvent | undefined = undefined,
  ){
    const { xRelative, yRelative } = this.findRelativeXY(event)

    let onParticle = this.findParticle(xRelative, yRelative);

    if(onParticle){
      this.replacingParticle = onParticle;
    }
  }

  handleCanvasClick(
      event: MouseEvent | undefined = undefined,
      pointsFromRandomGenerator: IParticle | undefined = undefined
    ){
    if(!event || this.replacingParticle){
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

    const { xRelative, yRelative } = this.findRelativeXY(event)

    let onParticle = this.findParticle(xRelative, yRelative);

    if(this.isIsInPulsePointAddMode.value && !onParticle){
      // delete any old temporary pulse point and redraw
      this.deleteTemporaryPulsePoint(true)

      this.pulseXControl.patchValue(xRelative);
      this.pulseYControl.patchValue(yRelative);

      this.temporaryPulsePoint = new Pulse();
      this.temporaryPulsePoint.x = xRelative;
      this.temporaryPulsePoint.y = yRelative;
      this.temporaryPulsePoint.isTemporary = true;
      this.temporaryPulsePoint.color = this.pulseColorControl.value as string;

      this.canvasService.drawPulsePoint(this.temporaryPulsePoint)

      // this.addCustomPulsePoint();
      return;
    }

    if(this.isShiftKeyPressed && onParticle){
      this.particles = this.particles.filter((particle) => particle.id !== onParticle.id);
      this.saveToLocalStorage();
      this.canvasService.drawParticlesOnCanvas(this.particles, this.pulsePoints);
      return;
    }

    let particleType: 'regular' | 'blackHole' | 'star' | 'planet' = 'regular';
    let particlePlanetSubType: 'rock' | 'gas' = 'rock';

    if(this.particleIsBlackHoleControl.value){
      particleType = 'blackHole'
    }
    if(this.particleIsStarControl.value){
      particleType = 'star'
    }
    if(this.particleIsPlanetControl.value){
      particleType = 'planet'
    }
    if(this.particleIsPlanetGasSubtypeControl.value){
      particlePlanetSubType = 'gas'
    }

    if(this.isSpaceSimulationModeControl.value && particleType === 'regular'){
      this.matSnackBar.open('Space Simulation Mode Is ON. Please choose one from available space body types or turn it off!', 'OK')
      return;
    }

    const newParticle = new Particle(
        this.counter,
        xRelative,
        yRelative ,
        this.newParticleRadius,
        Number(this.particleMassControl.value),
        this.particleMassUnitControl.value as 'kg' | 'g',
        {name: '', description: ''},
        String(this.particleColorControl.value),
        0,
        particleType,
        particlePlanetSubType,
        !!this.particleIsPlanetHasCirclesControl.value
      )

    let overlappingWith = this.canvasService.getOverlappingParticles(newParticle, this.particles).overlappingWith;
    if(overlappingWith.length){
      // this  will reset particles error high light
      setTimeout(() => {
        this.particles = this.particles.map((particle) => { particle.highLightError = false; return particle })
        this.canvasService.drawParticlesOnCanvas(this.particles, this.pulsePoints)
      },100)
    }else{
      this.particles.push(
        newParticle
      )

      this.counter = this.counter + 1;
    }

    this.saveToLocalStorage();
    this.canvasService.drawParticlesOnCanvas(this.particles, this.pulsePoints);
  }

  clearAllParticles(){
    this.counter = 1;
    this.particles = [];
    this.saveToLocalStorage();
    this.canvasService.drawParticlesOnCanvas([], this.pulsePoints)
  }


  // LOCAL STORAGE STAFF ===============================
  loadLocalParticlesAndDraw(){
    let localParticles = localStorage.getItem('particles');
    if(localParticles){
      this.particles = JSON.parse(localParticles);
      this.particles = this.particles.map((particle) => {
        return new Particle(
          particle.id,
          particle.x,
          particle.y,
          particle.radius,
          particle.mass,
          particle.massUnit,
          particle.category,
          particle.color,
          particle.gravitationalConstant,
          particle.type,
          particle.planetSubType,
          particle.planetHasRings
        )
      })

      this.canvasService.drawParticlesOnCanvas(this.particles, this.pulsePoints)
      this.counter = this.particles.length + 1;
    }
  }

  loadLocalCustomForces(){
    let localForces = localStorage.getItem('forces');

    if(localForces){
      this.customForces = JSON.parse(localForces);

      this.customForces = this.customForces.map((force) => {
        return new Vector(force.id, force.x, force.y, force.color, force.forceName, force.isActive);
      })
    }
  }

  loadLocalPulsePoints(){
    let localPulsePoints = localStorage.getItem('pulsePoints');

    if(localPulsePoints){
      this.pulsePoints = JSON.parse(localPulsePoints);

      this.pulsePoints = this.pulsePoints.map((pulse) => {

        this.canvasService.drawPulsePoint(pulse)
        return new Pulse(
          pulse.id, pulse.x, pulse.y, pulse.maxRadius, pulse.power, pulse.color, pulse.duration, 0 , pulse.isActive, pulse.pulseInterval);
      })
    }
  }

  loadLocalPlanetPoints(){
    let localPlanets = localStorage.getItem('planets');
    if(localPlanets){
      let parsedPlanets:Particle[] = JSON.parse(localPlanets);
      let ids:any = [];
      this.planets = parsedPlanets.map((particle) => {
        ids.push(particle.id);
        return new Particle(
          particle.id,
          particle.x,
          particle.y,
          particle.radius,
          particle.mass,
          particle.massUnit,
          particle.category,
          particle.color,
          particle.gravitationalConstant,
          particle.type,
          particle.planetSubType,
          particle.planetHasRings,
        )
      })
      //@ts-ignore
      this.planetsControl.patchValue(this.planets.map((planet) => planet.id), {emitEvent: false})
    }
  }

  loadRealGravityStatus(){
    let status = localStorage.getItem('realLifeGravity')
    this.gravityStatusControl.patchValue(status === 'true')
  }

  loadAirResistanceStatus(){
    let status = localStorage.getItem('airResistance')
    this.airResistanceStatusControl.patchValue(status === 'true')
  }

  loadIsSpaceSimulationStatus(){
    let status = localStorage.getItem('isSpaceSimulation')
    this.isSpaceSimulationModeControl.patchValue(status === 'true')
  }

  saveForcesToLocalStorage(){
    localStorage.setItem('forces', JSON.stringify(this.customForces));
  }

  saveToLocalStorage(){
    localStorage.setItem('particles', JSON.stringify(this.particles));
  }

  savePulsePointsLocalStorage(){
    localStorage.setItem('pulsePoints', JSON.stringify(this.pulsePoints));
  }

  savePlanetPointsToLocalStorage(){
    localStorage.setItem('planets', JSON.stringify(this.planets));
  }

  saveRealLifeGravityForceToLocalStorage(){
    localStorage.setItem('realLifeGravity', String(this.gravityStatusControl.value));
  }

  saveAirResistanceForceToLocalStorage(){
    localStorage.setItem('airResistance', String(this.airResistanceStatusControl.value));
  }

  saveIsSpaceSimulationLocalStorage(){
    localStorage.setItem('isSpaceSimulation', String(this.isSpaceSimulationModeControl.value));
  }
  // ===================================================


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

  findRelativeXY(
    event: MouseEvent | undefined = undefined,
  ): {xRelative:number, yRelative:number} {
    if(!event){
      return {xRelative:-1, yRelative:-1};
    }

    const rect = this.canvasService.canvasHTMLRef.nativeElement.getBoundingClientRect();
    const scaleX = this.canvasService.canvasHTMLRef.nativeElement.width / rect.width;
    const scaleY = this.canvasService.canvasHTMLRef.nativeElement.height / rect.height;

    // Calculate X coordinate relative to canvas's internal drawing surface
    const xRelative = (event.clientX - rect.left) * scaleX;
    // Calculate Y coordinate relative to canvas's internal drawing surface
    const yRelative = (event.clientY - rect.top) * scaleY;

    return { xRelative, yRelative }
  }

  particlePositionFixCloseToBorders(particle: Particle, customSurfaceElasticityValue:number | undefined= undefined){
    if (particle.x - particle.radius < 0) { // Check left wall
      particle.x = particle.radius;        // Reposition to just touch the wall
      particle.vx *= -(customSurfaceElasticityValue || Number(this.surfaceElasticityControl.value) || 1);
    } else if (particle.x + particle.radius > BOARD_CONSTANTS.width) { // Check right wall
      particle.x = BOARD_CONSTANTS.width - particle.radius; // Reposition to just touch the wall
      particle.vx *= -(customSurfaceElasticityValue || Number(this.surfaceElasticityControl.value) || 1);
    }

    // For Y-axis boundaries
    if (particle.y - particle.radius < 0) { // Check top wall
      particle.y = particle.radius;        // Reposition
      particle.vy *= -(customSurfaceElasticityValue || Number(this.surfaceElasticityControl.value) || 1);
    } else if (particle.y + particle.radius > BOARD_CONSTANTS.height) { // Check bottom wall
      particle.y = BOARD_CONSTANTS.height - particle.radius; // Reposition
      particle.vy *= -(customSurfaceElasticityValue || Number(this.surfaceElasticityControl.value) || 1);
    }
  }

  addCustomForce(){
    if(this.customForceForm.invalid){
      this.customForceForm.markAsTouched();
      return;
    }

    this.customForces.push(
      new Vector(
        '',
        this.temporaryVector.x,
        this.temporaryVector.y,
        this.temporaryVector.color,
        this.temporaryVector.forceName,
      )
    )

    this.customForceXControl.setValue(0)
    this.customForceYControl.setValue(0)
    this.customForceColorControl.setValue('#1b00ff')
    this.customForceNameControl.setValue('')

    this.saveForcesToLocalStorage();
  }

  deleteCustomPlanetPoint(id:number){
    this.planets = this.planets.filter((planet) => {
      return planet.id !== id;
    })

    //@ts-ignore
    this.planetsControl.patchValue(this.planets.map((planet) => planet.id), {emitEvent: false})
    this.savePlanetPointsToLocalStorage();
  }

  deleteCustomForce(id:string){
    this.customForces = this.customForces.filter((force) => {
      return force.id !== id;
    })

    this.saveForcesToLocalStorage();
  }

  deletePulsePoint(id:string){
    this.pulsePoints = this.pulsePoints.filter((pulse) => {
      return pulse.id !== id;
    })

    this.canvasService.drawParticlesOnCanvas(this.particles, this.pulsePoints)
    this.savePulsePointsLocalStorage();
  }


  addCustomPulsePoint(){
    if(
      !this.pulseMaxRadiusControl.value ||
      !this.pulsePowerControl.value ||
      !this.pulseDurationControl.value
    ){
      this.pulseMaxRadiusControl.markAsTouched()
      this.pulsePowerControl.markAsTouched()
      this.pulseDurationControl.markAsTouched()
      return
    }

    let newPulse = new Pulse(
      '',
      this.pulseXControl.value!,
      this.pulseYControl.value!,
      this.pulseMaxRadiusControl.value!,
      this.pulsePowerControl.value!,
      this.pulseColorControl.value!,
      this.pulseDurationControl.value!,
      0,
      true,
      this.pulseIntervalControl.value!,
      // this.pulseApplyOnControl.value!
    )
    this.pulsePoints.push(
      newPulse
    )

    this.customPulseForm.reset();
    this.pulseColorControl.patchValue('#ff0000')
    this.canvasService.drawPulsePoint(newPulse)

    this.savePulsePointsLocalStorage()
    this.deleteTemporaryPulsePoint(true);
  }

  deleteTemporaryPulsePoint(redrawCanvas: boolean = false){
    this.temporaryPulsePoint = undefined;

    if(redrawCanvas){
      this.canvasService.drawParticlesOnCanvas(
        this.particles,
        this.pulsePoints
      )
    }
  }

  toggleShowMassChangeInputForParticle(particle: Particle){
    this.showMassChangeInputForParticle[particle.id] = {
      show: true,
      originalValue: particle.mass,
      newValue: particle.mass,
      massUnit: particle.massUnit
    }
  }

  toggleShowRadiusChangeInputForParticle(particle: Particle){
    this.showRadiusChangeInputForParticle[particle.id] = {
      show: true,
      originalValue: particle.radius,
      newValue: particle.radius,
    }
  }

  hideMassChangeInputForParticle(particle: Particle){
    particle.mass = this.showMassChangeInputForParticle[particle.id].originalValue;
    delete this.showMassChangeInputForParticle[particle.id]
  }

  applyMassChangeInputForParticle(particle: Particle){
    particle.mass = this.showMassChangeInputForParticle[particle.id].newValue;
    this.saveToLocalStorage()
    delete this.showMassChangeInputForParticle[particle.id]
  }

  changeMassUnit(particle: Particle, unit: 'kg' | 'g'){
    this.showMassChangeInputForParticle[particle.id].massUnit = unit;
    particle.massUnit = unit
  }

  hideRadiusChangeInputForParticle(particle: Particle){
    particle.radius = this.showRadiusChangeInputForParticle[particle.id].originalValue;
    delete this.showRadiusChangeInputForParticle[particle.id]
  }

  applyRadiusChangeInputForParticle(particle: Particle){
    particle.radius = this.showRadiusChangeInputForParticle[particle.id].newValue;
    this.saveToLocalStorage();
    this.canvasService.drawParticlesOnCanvas(this.particles, this.pulsePoints)
    delete this.showRadiusChangeInputForParticle[particle.id]
  }
}
