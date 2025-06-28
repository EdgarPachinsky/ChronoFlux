export interface IParticleCategory {
  name: string
  description: string
}


export interface IParticle {
  id: number
  x: number
  y: number

  vx: number
  vy: number
  speed: number
  radius: number
  highLightError: boolean
  color: string
  mass: number
  massUnit: 'kg' | 'g'
  category: IParticleCategory
  gravitationalConstant: number
  rotation: number
  planetHasRings: boolean
  rippleTime: number
  type: 'regular' | 'blackHole' | 'star' | 'planet'
  planetSubType: 'rock' | 'gas'
}

