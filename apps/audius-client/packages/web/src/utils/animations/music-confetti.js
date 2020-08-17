// Utility Functions to compute confetti physics

export function degreesToRads(degrees) {
  return degrees / (180 * Math.PI)
}

export function radsToDegrees(radians) {
  return (radians * 180) / Math.PI
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

export function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

// Particle class representing a piece of confetti
// The particle holds the image, postion, and phsyics for moving in the animation
export class Particle {
  constructor(img, x, y, opacity, sizeRatio, friction, gravity, rotate, swing) {
    this.img = img
    this.center = x
    this.maxVx = randomRange(-10, 10) * sizeRatio
    this.maxVy = randomRange(-4, -0.3) * sizeRatio
    this.y = y
    this.x = x
    this.friction = friction
    this.gravity = gravity
    this.opacity = opacity
    this.sizeRatio = sizeRatio
    this.vx = this.maxVx
    this.ax = swing > 0 ? randomRange(0.001, swing) : 0
    this.vy = this.maxVy
    this.angle = degreesToRads(randomRange(0, 360))
    this.anglespin = rotate > 0 ? randomRange(-1 * rotate, rotate) : 0
  }

  update = ctx => {
    // Update particle position/physics
    this.x += this.vx
    this.y += this.vy
    this.vx += (this.center - this.x) * 0.8 * this.ax
    this.vx *= this.friction
    const vXDiff = 0.96 + 0.05 * Math.min(Math.abs(this.vx) / 10, 1)
    this.vy += this.gravity
    this.vy = this.vy * this.friction * vXDiff
    this.angle += this.anglespin

    // Draw onto canvas
    ctx.save()
    ctx.translate(Math.floor(this.x), Math.floor(this.y))
    ctx.rotate(this.angle)
    ctx.globalAlpha = this.opacity
    ctx.drawImage(this.img, 0, 0)
    ctx.restore()
  }
}

export default class Confetti {
  constructor(
    canvas,
    images,
    recycle = false,
    limit = 100,
    friction = 0.99,
    gravity = 0.2,
    rotate = 0.1,
    swing = 0.01,
    particleRate,
    onCompletion
  ) {
    const { clientWidth: width, clientHeight: height } = canvas
    this.width = width
    this.particleRate = particleRate
    this.images = images
    this.runAnimation = false
    this.friction = friction
    this.gravity = gravity
    this.height = height
    this.limit = limit
    this.rotate = rotate
    this.swing = swing
    this.recycle = recycle
    this.context = canvas.getContext('2d')
    this.particles = []
    this.particlesGenerated = 0
    this.onCompletion = onCompletion
  }

  generateParticle = (source, number) => {
    const x = randomRange(0, this.width)
    const y = -30 // Start the particle 30px above
    const opacity = randomRange(0.3, 0.9) // Range from 0.3 to 0.9
    const size = ((opacity + 0.2) * 5) / 6 // range 0.5 to 1
    const particleImg = this.images[randomInt(0, this.images.length - 1)]

    const imageCanvas = document.createElement('canvas')
    const imageContext = imageCanvas.getContext('2d')
    imageCanvas.height = particleImg.height * size
    imageCanvas.width = particleImg.width * size
    imageContext.drawImage(
      particleImg,
      0,
      0,
      imageCanvas.width,
      imageCanvas.height
    )

    return new Particle(
      imageCanvas,
      x,
      y,
      opacity,
      size,
      this.friction,
      this.gravity,
      this.rotate,
      this.swing
    )
  }

  removeParticleAt = idx => {
    this.particles.splice(idx, 1)
    if (!this.particles.length && this.onCompletion) {
      this.onCompletion()
    }
  }

  animate = () => {
    // Clear the previous screen
    this.context.clearRect(0, 0, this.width, this.height)

    const nP = this.particles.length

    // If recycling, continously create particles so that the number of particles is close to the limit
    const particleCount = this.recycle
      ? this.particles.length
      : this.particlesGenerated
    if (particleCount < this.limit) {
      if (particleCount < this.limit / 3) {
        this.particles.push(this.generateParticle())
        this.particlesGenerated += 1
      }
      if (particleCount < (2 * this.limit) / 3) {
        this.particles.push(this.generateParticle())
        this.particlesGenerated += 1
      }
      this.particles.push(this.generateParticle())
      this.particlesGenerated += 1
    }

    const removeParticlesIdx = []
    // Move each particle and remove if off the screen
    this.particles.forEach((p, i) => {
      p.update(this.context)
      if (
        p.y > this.height + 50 ||
        p.y < -100 ||
        p.x > this.width + 100 ||
        p.x < -100
      ) {
        if (this.recycle && particleCount <= this.limit) {
          // a brand new particle replacing the dead one
          this.particles[i] = this.generateParticle()
        } else {
          removeParticlesIdx.push(i)
        }
      }
    })

    // Remove all the particles at the same time after animation update
    for (let idx = 0; idx < removeParticlesIdx.length; idx += 1) {
      const particlesIndex =
        removeParticlesIdx[removeParticlesIdx.length - 1 - idx]
      this.removeParticleAt(particlesIndex)
    }

    return nP > 0 || this.particlesGenerated < this.limit
  }

  update = () => {
    if (this.animate() && this.run) {
      window.requestAnimationFrame(this.update)
    }
  }

  stop = () => {
    this.runAnimation = false
  }

  run = () => {
    this.runAnimation = true
    window.requestAnimationFrame(this.update)
  }
}
