import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundsService {

  // public soundsTurnedOn: boolean = false;
  // public bounce = new Audio('assets/sounds/bounce.mp3');

  constructor() { }

  public playSound(
    soundType: 'bounce'
  ) {
    // if(!this.soundsTurnedOn){
    //   return;
    // }
    //
    // // Clone the audio so multiple bounces can overlap without cutting each other
    // const sound = this[soundType].cloneNode() as HTMLAudioElement;
    // sound.play().catch(() => {});
  };
}
