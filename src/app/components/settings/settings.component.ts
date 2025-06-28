import {Component, OnDestroy, OnInit} from '@angular/core';
import {SettingsService} from "../../services/settings.service";
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSlider, MatSliderThumb} from "@angular/material/slider";
import {NgxColorsModule} from "ngx-colors";
import {GravityService} from "../../services/gravity.service";
import {MatCard, MatCardContent, MatCardHeader} from "@angular/material/card";
import {MatOption, MatSelect, MatSelectModule} from "@angular/material/select";
import {MatAccordion, MatExpansionModule, MatExpansionPanel} from "@angular/material/expansion";
import {NgClass} from "@angular/common";
import {MatTooltip} from "@angular/material/tooltip";
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {CustomForceComponent} from "../custom-force/custom-force.component";
import {repeat, Subscription} from "rxjs";
import {iterator} from "rxjs/internal/symbol/iterator";
import {CustomPulsePointComponent} from "../custom-pulse-point/custom-pulse-point.component";
import {CustomPlanetPointComponent} from "../custom-planet-point/custom-planet-point.component";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule, ReactiveFormsModule, MatSlider,
    MatSliderThumb, NgxColorsModule, MatCard, MatCardHeader, MatCardContent, MatSelect, MatOption,
    MatSelectModule, MatAccordion, MatExpansionPanel, MatExpansionModule, NgClass, MatTooltip, MatSlideToggle, CustomForceComponent, CustomPulsePointComponent, CustomPlanetPointComponent, MatMenu, MatMenuItem, MatMenuTrigger,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy{
  protected readonly Number = Number;
  protected readonly Math = Math;
  public $subscriptions = new Subscription();

  public settingsContainerConfig ={
    width: 0,
    height: 0,
  }

  constructor(
    public settingsService: SettingsService,
    public gravityService: GravityService,
  ) {
  }

  ngOnInit() {
    this.$subscriptions.add(
      this.settingsService.customForceForm.valueChanges.subscribe((res) => {
        this.settingsService.temporaryVector.x = res.x as number;
        this.settingsService.temporaryVector.y = res.y as number;
        this.settingsService.temporaryVector.color = res.color as string;
        this.settingsService.temporaryVector.forceName = res.name as string;
      })
    )

    this.$subscriptions.add(
      this.settingsService.planetsControl.valueChanges.subscribe((res:any) => {
        let planets = res.map((particleId: number) => {
          return this.settingsService.particles.find((particle) => particle.id === particleId)
        })

        this.settingsService.planets = [...planets]

        this.settingsService.savePlanetPointsToLocalStorage();
      })
    )

    this.$subscriptions.add(
      this.settingsService.gravityStatusControl.valueChanges.subscribe((res) => {
        this.settingsService.saveRealLifeGravityForceToLocalStorage()
      })
    )


    this.$subscriptions.add(
      this.settingsService.airResistanceStatusControl.valueChanges.subscribe((res) => {
        this.settingsService.saveAirResistanceForceToLocalStorage()
      })
    )

    this.$subscriptions.add(
      this.settingsService.isSpaceSimulationModeControl.valueChanges.subscribe((res) => {
        if(res){
          this.settingsService.gravityStatusControl.patchValue(false)
          this.settingsService.airResistanceStatusControl.patchValue(false)

          this.settingsService.particleIsBlackHoleControl.enable()
          this.settingsService.particleIsStarControl.enable()
          this.settingsService.particleIsPlanetControl.enable()
        }else{

          this.settingsService.particleIsBlackHoleControl.patchValue(false, {emitEvent: false})
          this.settingsService.particleIsBlackHoleControl.disable({emitEvent: false})

          this.settingsService.particleIsStarControl.patchValue(false, {emitEvent: false})
          this.settingsService.particleIsStarControl.disable({emitEvent: false})

          this.settingsService.particleIsPlanetControl.patchValue(false, {emitEvent: false})
          this.settingsService.particleIsPlanetControl.disable({emitEvent: false})
        }


        this.settingsService.saveIsSpaceSimulationLocalStorage();
      })
    )

    this.$subscriptions.add(
      this.settingsService.particleIsStarControl.valueChanges.subscribe((res) => {
        if(res){
          this.settingsService.particleIsBlackHoleControl.disable({emitEvent: false})
          this.settingsService.particleIsPlanetControl.disable({emitEvent: false})
        }else{

          this.settingsService.particleIsBlackHoleControl.enable({emitEvent: false})
          this.settingsService.particleIsPlanetControl.enable({emitEvent: false})
        }
      })
    )
    //
    this.$subscriptions.add(
      this.settingsService.particleIsBlackHoleControl.valueChanges.subscribe((res) => {
        if(res){
          this.settingsService.particleIsStarControl.disable({emitEvent: false})
          this.settingsService.particleIsPlanetControl.disable({emitEvent: false})
        }else{

          this.settingsService.particleIsStarControl.enable({emitEvent: false})
          this.settingsService.particleIsPlanetControl.enable({emitEvent: false})
        }
      })
    )
    //
    this.$subscriptions.add(
      this.settingsService.particleIsPlanetControl.valueChanges.subscribe((res) => {
        if(res){
          this.settingsService.particleIsStarControl.disable({emitEvent: false})
          this.settingsService.particleIsBlackHoleControl.disable({emitEvent: false})
        }else{
          this.settingsService.particleIsStarControl.enable({emitEvent: false})
          this.settingsService.particleIsBlackHoleControl.enable({emitEvent: false})
        }
      })
    )

    this.$subscriptions.add(
      this.settingsService.isIsInPulsePointAddMode.valueChanges.subscribe((res) => {
        if(!res){
          this.settingsService.deleteTemporaryPulsePoint(true);
        }
      })
    )


    this.setCanvasDimensions();
    window.addEventListener('resize', this.setCanvasDimensions.bind(this));
  }

  setCanvasDimensions() {
    const screenWidth = window.innerWidth;

    const canvasWidth = screenWidth >= 768 ? Math.floor(screenWidth * (0.35)) : screenWidth;

    const canvasHeight = window.innerHeight * 0.8; // You can adjust this as needed

    this.settingsContainerConfig.width = canvasWidth;
    this.settingsContainerConfig.height = Math.floor(canvasHeight);
  }

  showLabel(value: number){
    return `${value}`;
  }

  showLabelDeltaTime(value: number){
    return String(value).length === 4 ? `${value}0`: `${value}`;
  }

  ngOnDestroy() {
    this.$subscriptions.unsubscribe();
  }
}
