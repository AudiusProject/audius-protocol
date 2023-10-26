// Required to do this in order to play with webpack & create-react-app without ejecting
import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

//var glslify = require('glslify')
import Quad from 'gl-quad'
import inherits from 'inherits'

import createShader from 'gl-shader'

import toIdentity from 'gl-mat4/identity'
import mat4 from 'gl-mat4/create'

function Vignette(gl, options) {
  if (!(this instanceof Vignette)) return new Vignette(gl, options)
  Quad.call(this, gl)
  options = options || {}
  this.gl = gl

  var shader = options.shader

  if (!shader) {
    this.defaultShader = createShader(gl, vertexShader, fragmentShader)

    //defaultShader(gl)
  }
  this.shader = shader || this.defaultShader

  var identity = toIdentity(mat4())

  //some defaults
  this.style({
    aspect: gl.canvas.width / gl.canvas.height,
    smoothing: [-0.4, 0.8],
    noiseAlpha: 0.04,
    coloredNoise: true,
    offset: [0, 0],
    color1: [1, 1, 1],
    color2: [0, 0, 0],
    scale: [1.0, 1.0],
    projection: identity,
    view: identity,
    model: identity
  })

  //mix in user options
  if (options) this.style(options)
}

inherits(Vignette, Quad)

Vignette.prototype.style = function (options) {
  if (!options) return

  this.shader.bind()
  var uniforms = this.shader.uniforms
  for (var k in options) {
    if (
      options.hasOwnProperty(k) &&
      (options[k] || typeof options[k] === 'number')
    ) {
      uniforms[k] = options[k]
    }
  }
}

Vignette.prototype.draw = function () {
  Quad.prototype.draw.call(this, this.shader)
}

Vignette.prototype.dispose = function () {
  if (this.defaultShader) {
    this.defaultShader.dispose()
    this.defaultShader = undefined
  }
  Quad.prototype.dispose.call(this)
}

export default Vignette
