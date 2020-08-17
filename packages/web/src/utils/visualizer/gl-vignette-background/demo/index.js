var shader2

var createBackground = require('../')
var colorString = require('color-string')

var background

require('canvas-testbed')(render, start, {
    context: 'webgl',
    once: true
})

function rgb(str) {
    return colorString.getRgb(str).map(function(a) {
        return a/255
    })
}

function render(gl, width, height) {
    gl.clear(gl.COLOR_BUFFER_BIT)

    var radius = Math.max(width, height) * 1.05
    background.style({ 
        scale: [ 1/width * radius, 1/height * radius],
        aspect: 1,
        color1: rgb('#ffffff'),
        color2: rgb('#283844'),
        smoothing: [ -0.5, 1.0 ],
        noiseAlpha: 0.07,
        offset: [ -0.05, -0.15 ]
    })
    background.draw()
}

function start(gl) {
    background = createBackground(gl)
}