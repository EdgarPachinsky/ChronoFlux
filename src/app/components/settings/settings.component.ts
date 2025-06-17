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

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule, ReactiveFormsModule, MatSlider,
    MatSliderThumb, NgxColorsModule, MatCard, MatCardHeader, MatCardContent, MatSelect, MatOption,
    MatSelectModule, MatAccordion, MatExpansionPanel, MatExpansionModule, NgClass, MatTooltip, MatSlideToggle, CustomForceComponent, CustomPulsePointComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy{
  protected readonly Number = Number;
  protected readonly Math = Math;
  public $subscriptions = new Subscription();

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
