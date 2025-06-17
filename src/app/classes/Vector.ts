import {IVector} from "../models/vector.model";
import {SharedFunctional} from "./Shared-Functional";

export class Vector extends SharedFunctional implements IVector{
  public id: string;
  public x: number;
  public y: number;
  public color: string;
  public forceName: string;
  public showArrowInMiniParticle: boolean = true;
  public isActive: boolean = false;

  constructor(id = '', x = 0, y = 0, color = '', forceName = '', isActive: boolean = false) {
    super();
    this.id = id || this.generateSecureId(10);
    this.x = x;
    this.y = y;
    this.color = color;
    this.forceName = forceName;
    this.isActive = isActive;
  }

  get magnitude(): number { // Add magnitude for arrow length
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  get angle(): number { // Add angle for arrow rotation
    return Math.atan2(this.y, this.x); // Radians
  }
}
