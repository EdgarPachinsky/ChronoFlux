import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {SettingsService} from "../../services/settings.service";
import {BOARD_CONSTANTS} from "../../constants/board.constant";

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements AfterViewInit {

  protected readonly BOARD_CONSTANTS = BOARD_CONSTANTS;
  protected readonly Array = Array;

  public canvasContext!: CanvasRenderingContext2D;
  @ViewChild('mainCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent){
    console.log(event.key)
    this.settingsService.isShiftKeyPressed = event.key === 'Shift'
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent){
    this.settingsService.isShiftKeyPressed = false
  }

  constructor(
    public settingsService: SettingsService,
  ) {
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
