import {Component, Input, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SettingsService} from "../../services/settings.service";
import {CanvasService} from "../../services/canvas.service";
import {GravityService} from "../../services/gravity.service";
import {MatButton, MatButtonModule} from "@angular/material/button";
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {Particle} from "../../classes/Particle";
import {MatFormField, MatFormFieldModule} from "@angular/material/form-field";
import {MatInput, MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatSlider, MatSliderThumb} from "@angular/material/slider";
import {NgxColorsModule} from "ngx-colors";
import {MatCard, MatCardContent, MatCardHeader} from "@angular/material/card";
import {MatOption, MatSelect, MatSelectModule} from "@angular/material/select";
import {MatAccordion, MatExpansionModule, MatExpansionPanel} from "@angular/material/expansion";
import {NgClass} from "@angular/common";
import {MatTooltip} from "@angular/material/tooltip";
import {CustomForceComponent} from "../custom-force/custom-force.component";
import {CustomPulsePointComponent} from "../custom-pulse-point/custom-pulse-point.component";

@Component({
  selector: 'app-custom-planet-point',
  standalone: true,
  imports: [
    MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule, ReactiveFormsModule, MatSlider,
    MatSliderThumb, NgxColorsModule, MatCard, MatCardHeader, MatCardContent, MatSelect, MatOption,
    MatSelectModule, MatAccordion, MatExpansionPanel, MatExpansionModule, NgClass, MatTooltip, MatSlideToggle, CustomForceComponent, CustomPulsePointComponent
  ],
  templateUrl: './custom-planet-point.component.html',
  styleUrl: './custom-planet-point.component.scss'
})
export class CustomPlanetPointComponent implements OnInit{

  @Input() planetPoint!: Particle;
  public gravitationalConstantControl = new FormControl(0, [])
  public $subscriptions: Subscription = new Subscription();

  constructor(
    public settingsService: SettingsService,
    public canvasService: CanvasService,
    public gravityService: GravityService,
  ) {
  }

  ngOnInit() {
    if(this.planetPoint.gravitationalConstant){
      this.gravitationalConstantControl.patchValue(this.planetPoint.gravitationalConstant)
    }

    this.$subscriptions.add(
      this.gravitationalConstantControl.valueChanges.subscribe((res) => {
        this.planetPoint.gravitationalConstant = Number(res);

        this.settingsService.savePlanetPointsToLocalStorage();
      })
    )
  }

  protected readonly String = String;
}
