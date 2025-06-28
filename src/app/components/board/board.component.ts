import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {SettingsService} from "../../services/settings.service";
import {BOARD_CONSTANTS} from "../../constants/board.constant";
import {CustomPulsePointComponent} from "../custom-pulse-point/custom-pulse-point.component";
import {MatButton} from "@angular/material/button";
import {CanvasService} from "../../services/canvas.service";
import {GravityService} from "../../services/gravity.service";

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CustomPulsePointComponent,
    MatButton
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit, AfterViewInit {

  protected readonly BOARD_CONSTANTS = BOARD_CONSTANTS;
  protected readonly Array = Array;

  public canvasContext!: CanvasRenderingContext2D;
  @ViewChild('mainCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent){
    this.settingsService.isShiftKeyPressed = event.key === 'Shift'
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent){
    this.settingsService.isShiftKeyPressed = false
  }

  constructor(
    public settingsService: SettingsService,
    public canvasService: CanvasService,
    public gravityService: GravityService,
  ) {
  }

  setCanvasDimensions() {
    const screenWidth = window.innerWidth;

    const canvasWidth = screenWidth >= 768
      ? Math.floor(screenWidth * 0.6)
      : screenWidth;

    const canvasHeight = window.innerHeight * 0.8; // You can adjust this as needed

    this.BOARD_CONSTANTS.width = canvasWidth;
    this.BOARD_CONSTANTS.height = Math.floor(canvasHeight);
  }

  ngOnInit() {
    this.setCanvasDimensions();
    window.addEventListener('resize', this.setCanvasDimensions.bind(this));
  }

  ngAfterViewInit() {
    this.canvasContext = this.canvasRef.nativeElement.getContext('2d')!;

    this.settingsService.initializeCanvas(
      this.canvasContext,
      this.canvasRef
    )

    this.settingsService.loadLocalParticlesAndDraw();
    this.settingsService.loadLocalCustomForces();
    this.settingsService.loadLocalPulsePoints();
    this.settingsService.loadLocalPlanetPoints();

    this.settingsService.loadRealGravityStatus();
    this.settingsService.loadAirResistanceStatus();
    this.settingsService.loadIsSpaceSimulationStatus();
  }

  get loopCountTopBottom(): number {
    return Math.floor(BOARD_CONSTANTS.width / 10);
  }
  get loopCountLeftRight(): number {
    return Math.floor(BOARD_CONSTANTS.height / 10);
  }

  // Method to generate an array from 0 up to (but not including) a given number
  // If you want to include the upper bound, adjust the Array.from length.
  generateRange(count: number): number[] {
    return Array.from({ length: count + 1 }, (_, i) => i); // +1 to include the upper bound
  }

}
