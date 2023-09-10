# gl-vignette-background

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Creates a soft gradient background with noise, suitable for your sweet WebGL demos!

![demo](http://i.imgur.com/IMRLl9D.png)

```js
var createBackground = require('gl-vignette-background')

var width = 490,
	height = 400

var gl = require('webgl-context')({
    width: width
    height: height
})

require('domready')(function() {
	gl.clear(gl.COLOR_BUFFER_BIT)
    gl.viewport(0, 0, width, height)

    //create our quad
	var bg = createBackground(gl)

	var radius = width * 1.05

	//optional styling 
	bg.style({
        scale: [ 1/width * radius, 1/height * radius],
        aspect: 1,
        color1: [1, 1, 1],
        color2: [40/255, 56/255, 68/255], //rgb expressed in 0.0 - 1.0
        smoothing: [ -0.5, 1.0 ],
        noiseAlpha: 0.07,
        offset: [ -0.05, -0.15 ]
	})

	//draw the full-screen quad
	bg.draw()

    //place canvas on DOM
    document.body.appendChild(gl.canvas)
})
```

See [demo/index.js](demo/index.js) for a full-screen example.

## Usage

[![NPM](https://nodei.co/npm/gl-vignette-background.png)](https://nodei.co/npm/gl-vignette-background/)

Inherits functions and members from [gl-quad](https://www.npmjs.org/package/gl-quad).

## functions

### ```var bg = createBackground(gl [, style])```

Creates a background quad with some default options (bright and soft white gradient in the center, using the current canvas size for aspect ratio).

You can provide `style` to override some defaults, e.g:

```js
bg = createBackground(gl {
	color1: [ 1, 0, 0]
})
```

See [styling](#styling)


### ```bg.style(options)```

Style the background with the given overrides in the specified object. Acts the same as the styling options passed to constructor. 

### ```bg.draw()```

Draws the quad.

### ```bg.dispose()```

Disposes the quad and its shader.

## styling

The following options are stylable:

- `aspect`: a float for aspect ratio; typically set whenever the background size changes
- `smoothing`: a vec2 representing the low and high end for the smooth function
- `noiseAlpha`: the opacity of the random noise (set to zero to disable)
- `coloredNoise`: a bool for whether noise is enabled, `1` for chromatic, `0` for monochrome
- `offset`: the position vec2 offset, normalized. `[0, 0]` is center (default), `[-0.5, -0.5]` will be top left
- `scale`: the vec2 amount to scale the gradient, normalized. default is `[1, 1]`
- `color1`: the first `[r, g, b]` color in the gradient, default white
- `color2`: the second `[r, g, b]` color in the gradient, default black

## running the demo

Install [beefy](https://www.npmjs.org/package/beefy) and run:

```beefy demo/index.js --open```

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/gl-vignette-background/blob/master/LICENSE.md) for details.
