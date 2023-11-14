export const motion = {
  quick: '0.07s ease-in-out',
  expressive: '0.18s ease-in-out',
  hover: '0.12s cubic-bezier(0.44, 0, 0.56, 1)',
  press: '0.12s cubic-bezier(0.44, 0, 0.56, 1)',
  calm: '0.5s ease-in-out'
}

export type Motion = typeof motion
export type MotionOptions = keyof Motion

export const spring = {
  standard: {
    tension: 310,
    friction: 25,
    clamp: true
  },
  wobble: {
    tension: 250,
    friction: 25
  },
  slowWobble: {
    tension: 175,
    friction: 20
  },
  stiff: {
    tension: 215,
    friction: 40
  },
  fast: {
    tension: 300,
    friction: 40
  }
}

export type Spring = typeof spring
export type SpringOptions = keyof Spring
