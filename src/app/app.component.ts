import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {BoardComponent} from "./components/board/board.component";
import {SettingsComponent} from "./components/settings/settings.component";
import {NgStyle} from "@angular/common";
import {BOARD_CONSTANTS} from "./constants/board.constant";
import {MatTooltip} from "@angular/material/tooltip";
import {MatDialog} from "@angular/material/dialog";
import {InstructionsComponent} from "./components/instructions/instructions.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BoardComponent, SettingsComponent, NgStyle, MatTooltip],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'particle-physics-simulation';
  protected readonly BOARD_CONSTANTS = BOARD_CONSTANTS;

  constructor(
    public matDialog: MatDialog,
  ) {
  }

  openInstructions(){
    this.matDialog.open(InstructionsComponent, {})
  }
}
