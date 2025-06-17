import {AfterViewInit, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {SettingsService} from "../../services/settings.service";
import {Vector} from "../../classes/Vector";
import {MatButton} from "@angular/material/button";
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {NgClass} from "@angular/common";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {Subscription} from "rxjs";
import {readableStreamLikeToAsyncGenerator} from "rxjs/internal/util/isReadableStreamLike";

@Component({
  selector: 'app-custom-force',
  standalone: true,
  imports: [
    MatButton,
    MatSlideToggle,
    NgClass,
    ReactiveFormsModule
  ],
  templateUrl: './custom-force.component.html',
  styleUrl: './custom-force.component.scss'
})
export class CustomForceComponent implements OnInit{

  @Input() force!: Vector;
  public $subscriptions: Subscription = new Subscription();
  public isActiveControl = new FormControl(false, [])

  constructor(
    public settingsService: SettingsService,
  ) {
  }

  ngOnInit() {
    this.isActiveControl.patchValue(
      this.force.isActive
    )

    this.$subscriptions.add(
      this.isActiveControl.valueChanges.subscribe((res) => {
        this.force.isActive = !!res;

        this.settingsService.saveForcesToLocalStorage()
      })
    )
  }
}
