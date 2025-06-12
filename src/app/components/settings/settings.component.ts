import { Component } from '@angular/core';
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

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule, ReactiveFormsModule, MatSlider,
    MatSliderThumb, NgxColorsModule, MatCard, MatCardHeader, MatCardContent, MatSelect, MatOption,
    MatSelectModule, MatAccordion, MatExpansionPanel, MatExpansionModule, NgClass, MatTooltip,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  protected readonly Number = Number;
  protected readonly Math = Math;

  constructor(
    public settingsService: SettingsService,
    public gravityService: GravityService,
  ) {
  }

  showLabel(value: number){
    return `${value}`;
  }

  showLabelDeltaTime(value: number){
    return String(value).length === 4 ? `${value}0`: `${value}`;
  }
}
