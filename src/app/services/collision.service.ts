import {Injectable} from "@angular/core";
import {Particle} from "../classes/Particle";
import {SettingsService} from "./settings.service";
import {BOARD_CONSTANTS} from "../constants/board.constant";

@Injectable({
  providedIn: 'root'
})
export class CollisionService {

  constructor(
    // public settingsService:SettingsService,
  ) {
  }

  checkAndResolveCollision(particle: Particle, particles: Particle[]){
    let otherParticles = particles.filter((_particle: Particle) => _particle.id !== particle.id)

    let collisionWith = this.checkCollisionWithOtherParticles(particle, otherParticles);

    if(collisionWith.length){
      collisionWith.forEach((collisionWithEl) => {
        this.resolveCollision(particle, collisionWithEl)
      })
    }
  }

  checkCollisionWithOtherParticles(
    particle: Particle,
    otherParticles: Particle[]
  ){
    let collisionWith: Particle[] = [];

    otherParticles.forEach(otherParticle => {

      let distanceToCurrentParticle = Math.sqrt(
        Math.pow((particle.x - otherParticle.x), 2) + Math.pow((particle.y - otherParticle.y), 2)
      )

      let minimumNoCollisionDistance = particle.radius + otherParticle.radius;

      if(distanceToCurrentParticle < minimumNoCollisionDistance){
        collisionWith.push(otherParticle)
      }
    })

    return collisionWith;
  }

  resolveCollision(
    p1:Particle, p2:Particle
  ){
    // 1. We need to calculate normal vector
    // this is direction from one particle to another
    // this tells which way particles pus each other
    // in physics collisions bounce happen in normal collision axis
    // we need this to compute
    //  to find how much they are moving toward each other
    //  how to reverse that movement
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy); // distance between centers

    // to find normal vector x and y, we need to divide dx and dy to distance
    // (nx, ny) is normal vector now
    // p1 ● -----------→ ● p2
    // normal →
    const nx = dx / dist;
    const ny = dy / dist;

    // 2. Relative velocity
    // we need to find now how tho particles are moving relative to each other
    // this says that how fast and in what direction does p1 approaching to p2
    //     vel1 →
    // p1 ●        ● p2
    //          ← vel2
    //
    // Relative velocity = vel1 - vel2 → tells us how particles approach
    const rvx = p1.vx - p2.vx;
    const rvy = p1.vy - p2.vy;

    // 3. We need to project relative velocity onto normal vector
    // We're only interested in velocity toward each other, not sideways.
    // This is called the dot product, and it tells us:
    //   If > 0 → they’re separating (don’t resolve)
    //   If < 0 → they’re moving into each other (must resolve!)
    const velocityAlongNormal = rvx * nx + rvy * ny;

    // 4. Impulse = Apply Collision Response
    // If the particles are moving toward each other:
    // We calculate how much we need to change their velocities so they bounce apart.
    const restitution = 1; // 1 = perfectly elastic (no energy loss)
    const impulse = (2 * velocityAlongNormal) / (p1.mass + p2.mass);
    // Then apply that impulse along the normal vector:
    p1.vx -= (impulse * p2.mass) * nx;
    p1.vy -= (impulse * p2.mass) * ny;

    p2.vx += (impulse * p1.mass) * nx;
    p2.vy += (impulse * p1.mass) * ny;

    // 5. Position Correction (Prevent "Sinking")
    const overlap = (p1.radius + p2.radius) - dist;
    const correction = (overlap / 2);
    // Move them apart along the normal vector:
    p1.x -= correction * nx;
    p1.y -= correction * ny;
    p2.x += correction * nx;
    p2.y += correction * ny;


    if (p2.x - p2.radius < 0) {
      p2.x = p2.radius;
      p2.vx *= -1;
    } else if (p2.x + p2.radius > BOARD_CONSTANTS.width) {
      p2.x = BOARD_CONSTANTS.width - p2.radius;
      p2.vx *= -1;
    }

    if (p2.y - p2.radius < 0) {
      p2.y = p2.radius;
      p2.vy *= -1;
    } else if (p2.y + p2.radius > BOARD_CONSTANTS.height) {
      p2.y = BOARD_CONSTANTS.height - p2.radius;
      p2.vy *= -1;
    }
  }
}
