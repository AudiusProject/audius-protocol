import * as PIXI from 'pixi.js'

import bgLargeWave from 'assets/img/bgWaveLarge.svg'
import bgSmallWave from 'assets/img/bgWaveSmall.svg'

// Prevent Pixi lib from printing to console
PIXI.utils.skipHello()

export class Wave {
  constructor(type, height, width, opacity, speed, yPos, offset = 0) {
    const texture =
      type === 'small'
        ? PIXI.loader.resources[bgSmallWave].texture
        : PIXI.loader.resources[bgLargeWave].texture
    this.height = height
    this.width = width
    this.opacity = opacity
    this.speed = speed
    this.sprites = [new PIXI.Sprite(texture)]
    this.spriteWidth = this.sprites[0].width
    this.spriteHeight = this.sprites[0].height

    this.offset =
      typeof offset === 'function' ? offset(width, this.spriteWidth) : offset
    this.numImages = Math.ceil(width / this.spriteWidth) + 1
    for (let i = 0; i < this.numImages - 1; i++) {
      this.sprites.push(new PIXI.Sprite(texture))
    }
    this.start = -1 * this.spriteWidth + this.offset
    this.sprites.forEach((sprite, i) => {
      sprite.blendMode = PIXI.BLEND_MODES.SCREEN
      sprite.alpha = this.opacity
      sprite.y = yPos(height, this.spriteHeight)
      sprite.x = this.start + i * this.spriteWidth
    })
  }

  update = () => {
    this.start = 0
    this.sprites.forEach(sprite => {
      sprite.x = sprite.x + this.speed * 0.16
      if (sprite.x < this.start) this.start = sprite.x
    })
    this.sprites.forEach(sprite => {
      if (sprite.x > this.width) {
        sprite.x = this.state - this.spriteWidth
        this.start = sprite.x
      }
    })
  }
}

const resourcesToLoad = [bgSmallWave, bgLargeWave]
const isReady = new Promise(resolve =>
  PIXI.loader.add(resourcesToLoad).load(() => resolve(true))
)

export default class WaveBG {
  static loadResources = async () => {
    return isReady
  }

  constructor(container, useStatic, waveConfig) {
    this.container = container
    this.app = new PIXI.Application({ transparent: true })
    this.app.renderer.view.style.position = 'absolute'
    this.app.renderer.view.style.display = 'block'
    this.app.renderer.autoResize = true
    this.app.renderer.resize(window.innerWidth, window.innerHeight)
    this.useStatic = useStatic
    this.waveConfig = waveConfig
    this.setup()
  }

  getBackground = (width, height) => {
    const radius = Math.sqrt(width ** 2 + height ** 2)
    const bgCanvas = document.createElement('canvas')
    bgCanvas.width = width
    bgCanvas.height = height
    const backgroundContext = bgCanvas.getContext('2d', { alpha: false })

    const gradient = backgroundContext.createRadialGradient(
      0,
      0,
      Math.ceil(radius / 2),
      0,
      0,
      Math.ceil(radius)
    )

    // Add three color stops
    gradient.addColorStop(0, '#B749D6')
    gradient.addColorStop(1, '#6516A3')

    // Set the fill style and draw a rectangle
    backgroundContext.fillStyle = gradient
    backgroundContext.fillRect(0, 0, width, height)
    return new PIXI.Sprite(PIXI.Texture.fromCanvas(bgCanvas))
  }

  setup = () => {
    if (this.container) {
      this.container.appendChild(this.app.view)
      this.width = this.app.renderer.width
      this.height = this.app.renderer.height
      this.background = this.getBackground(this.width, this.height)
      this.app.stage.addChild(this.background)
      this.createWaves()
      // Listen for frame updates
      if (!this.useStatic) {
        this.app.ticker.add(() => {
          this.waves.forEach(wave => {
            wave.update()
          })
        })
      }
    }
  }

  createWaves = () => {
    this.waves = this.waveConfig.map(waveConfig => {
      return new Wave(
        waveConfig.type,
        this.app.renderer.height,
        this.app.renderer.width,
        waveConfig.opacity,
        waveConfig.speed,
        waveConfig.yPos,
        waveConfig.offset
      )
    })
    this.waves.forEach(wave =>
      wave.sprites.forEach(sprite => {
        this.app.stage.addChild(sprite)
      })
    )
  }

  resize = () => {
    this.app.renderer.resize(window.innerWidth, window.innerHeight)
    this.width = this.app.renderer.width
    this.height = this.app.renderer.height
    this.background = this.getBackground(this.width, this.height)
    this.app.stage.addChild(this.background)
    this.waves.forEach(wave =>
      wave.sprites.forEach(sprite => {
        this.app.stage.removeChild(sprite)
      })
    )
    this.createWaves()
  }

  pause = () => {
    this.app.stop()
  }

  start = () => {
    this.app.start()
  }

  remove = () => {
    this.app.stop()
    this.app.destroy(true)
    this.app = null
  }
}
