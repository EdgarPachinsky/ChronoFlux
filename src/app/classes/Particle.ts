import {IParticle, IParticleCategory} from "../models/particle.model";
import {Vector} from "./Vector";

export class Particle implements IParticle{

  public id = 0;
  public x = 0;
  public y = 0;
  public vx = 0;
  public vy = 0;
  public radius = 0;
  public speed = 0;
  public color = 'black'
  public mass = 0;
  public massUnit: 'kg' | 'g' = 'kg';
  public highLightError = false;
  public isAtRest: boolean = false;
  public gravitationalConstant: number = 0;

  public type: 'regular' | 'blackHole' | 'star' | 'planet' = 'regular'
  public planetSubType: 'rock' | 'gas' = 'rock'
  public planetHasRings: boolean = false;

  public forceVectors: Vector[] = [];

  public category = {
    name: "Particle",
    description: "Particle description"
  }

  public rotation = 0;
  public pulsePhase  = 0;
  public rippleTime = 0;

  constructor(
    id = 0, x = 0, y = 0, radius = 0, mass = 0, massUnit:'kg' | 'g' = 'kg', category: IParticleCategory, color: string, gravitationalConstant = 0,
    type: 'regular' | 'blackHole' | 'star' | 'planet' = 'regular', planetSubType: 'rock' | 'gas' = 'rock', hasRings: boolean = false
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.mass = mass;
    this.massUnit = massUnit;
    this.color = color || 'black';
    this.category = category;
    this.gravitationalConstant = gravitationalConstant;
    this.type = type;
    this.planetSubType= planetSubType;
    this.planetHasRings= hasRings;
  }

  public get convertedMass(){
    return this.massUnit !== 'kg' ? this.mass / 1000: this.mass
  }

  public get typeLabel(){
    let type:string = "";
    switch (this.type){
      case "regular":
        type = 'Regular';
        break;
      case "blackHole":
        type = 'Black Hole';
        break;
      case "star":
        type = 'Star';
        break;
      case "planet":
        type = 'Planet';
        break;
      default:
        break;
    }
    return type;
  }
  public get typePlanetSubTypeLabel(){
    let type:string = "";
    switch (this.planetSubType){
      case "rock":
        type = 'Rock';
        break;
      case "gas":
        type = 'Gas';
        break;

      default:
        break;
    }
    return type;
  }
}
