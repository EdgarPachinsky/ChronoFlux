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
  public massUnit = 'kg';
  public highLightError = false;
  public isAtRest: boolean = false;

  public forceVectors: Vector[] = [];

  public category = {
    name: "Particle",
    description: "Particle description"
  }

  constructor(
    id = 0, x = 0, y = 0, radius = 0, mass = 0, massUnit = 'kg', category: IParticleCategory, color: string
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.mass = mass;
    this.massUnit = massUnit;
    this.color = color || 'black';
    this.category = category;
  }

  public get convertedMass(){
    return this.massUnit !== 'KG' ? this.mass / 1000: this.mass
  }
}
