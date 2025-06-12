import {IVector} from "../models/vector.model";

export class Vector implements IVector{
  public x: number;
  public y: number;
  public color: string;
  public forceName: string;
  public showArrowInMiniParticle: boolean = true;

  constructor(x = 0, y = 0, color = '', forceName = '') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.forceName = forceName;
  }

  get magnitude(): number { // Add magnitude for arrow length
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  get angle(): number { // Add angle for arrow rotation
    return Math.atan2(this.y, this.x); // Radians
  }
}
