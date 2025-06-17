import {Component, Input, OnInit} from '@angular/core';
import {Vector} from "../../classes/Vector";
import {Subscription} from "rxjs";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {Pulse} from "../../classes/Pulse";
import {MatButton} from "@angular/material/button";
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {SettingsService} from "../../services/settings.service";
import {CanvasService} from "../../services/canvas.service";
import {GravityService} from "../../services/gravity.service";

@Component({
  selector: 'app-custom-pulse-point',
  standalone: true,
  imports: [
    MatButton,
    MatSlideToggle,
    ReactiveFormsModule
  ],
  templateUrl: './custom-pulse-point.component.html',
  styleUrl: './custom-pulse-point.component.scss'
})
export class CustomPulsePointComponent implements OnInit{
  @Input() pulsePoint!: Pulse;
  public $subscriptions: Subscription = new Subscription();
  public isActiveControl = new FormControl(false, [])

  constructor(
    public settingsService: SettingsService,
    public canvasService: CanvasService,
    public gravityService: GravityService,
  ) {
  }

  ngOnInit() {
    this.isActiveControl.patchValue(
      this.pulsePoint.isActive
    )

    this.$subscriptions.add(
      this.isActiveControl.valueChanges.subscribe((res) => {
        this.pulsePoint.isActive = !!res;

        this.settingsService.savePulsePointsLocalStorage()
      })
    )
  }
}
