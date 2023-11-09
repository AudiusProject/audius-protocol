import createBuffer from 'gl-buffer'
import createVAO from 'gl-vao'

import pack from 'array-pack-2d'
import identity from 'gl-mat4/identity'
import clamp from 'clamp'

export default function (gl, shader, path) {
  if (!shader) throw new TypeError('need to pass a shader')
  shader.bind()
  shader.attributes.position.location = 0
  shader.attributes.direction.location = 1
  shader.attributes.next.location = 2
  shader.attributes.previous.location = 3

  // each vertex has the following attribs:
  // vec3 position   //current point on line
  // vec3 previous   //previous point on line
  // vec3 next       //next point on line
  // float direction //a sign, -1 or 1

  // we submit two vertices per point so that
  // we can expand them away from each other
  let indexBuffer = emptyBuffer(Uint16Array, gl.ELEMENT_ARRAY_BUFFER)
  let positionBuffer = emptyBuffer()
  let previousBuffer = emptyBuffer()
  let nextBuffer = emptyBuffer()
  let directionBuffer = emptyBuffer()
  let count = 0
  let vao = createVAO(gl)

  // default uniforms
  let model = identity([])
  let projection = identity([])
  let view = identity([])
  let thickness = 1
  let aspect = 1
  let miter = 0
  let color = [1, 1, 1]

  if (path) update(path)

  return {
    update,
    model,
    view,
    projection,
    thickness,
    color,
    miter,
    aspect,

    draw() {
      shader.bind()
      shader.uniforms.model = this.model
      shader.uniforms.view = this.view
      shader.uniforms.projection = this.projection
      shader.uniforms.color = this.color
      shader.uniforms.thickness = this.thickness
      shader.uniforms.aspect = this.aspect
      shader.uniforms.miter = this.miter

      vao.bind()
      vao.draw(gl.TRIANGLES, count)
      vao.unbind()
    }
  }

  // in real-world you wouldn't want to create so
  // many typed arrays per frame
  function update(path) {
    // ensure 3 component vectors
    if (path.length > 0 && path[0].length !== 3) {
      path = path.map((point) => {
        let [x, y, z] = point
        return [x || 0, y || 0, z || 0]
      })
    }

    count = (path.length - 1) * 6

    // each pair has a mirrored direction
    let direction = duplicate(
      path.map((x) => 1),
      true
    )
    // now get the positional data for each vertex
    let positions = duplicate(path)
    let previous = duplicate(path.map(relative(-1)))
    let next = duplicate(path.map(relative(+1)))
    let indexUint16 = createIndices(path.length)

    // now update the buffers with float/short data
    positionBuffer.update(pack(positions))
    previousBuffer.update(pack(previous))
    nextBuffer.update(pack(next))
    directionBuffer.update(pack(direction))
    indexBuffer.update(indexUint16)

    vao.update(
      [
        { buffer: positionBuffer, size: 3 },
        { buffer: directionBuffer, size: 1 },
        { buffer: nextBuffer, size: 3 },
        { buffer: previousBuffer, size: 3 }
      ],
      indexBuffer
    )
  }

  function emptyBuffer(ArrayType, type) {
    ArrayType = ArrayType || Float32Array
    return createBuffer(
      gl,
      new ArrayType(),
      type || gl.ARRAY_BUFFER,
      gl.STATIC_DRAW
    )
  }
}

function relative(offset) {
  return (point, index, list) => {
    index = clamp(index + offset, 0, list.length - 1)
    return list[index]
  }
}

function duplicate(nestedArray, mirror) {
  var out = []
  nestedArray.forEach((x) => {
    let x1 = mirror ? -x : x
    out.push(x1, x)
  })
  return out
}

// counter-clockwise indices but prepared for duplicate vertices
function createIndices(length) {
  let indices = new Uint16Array(length * 6)
  let c = 0
  let index = 0
  for (let j = 0; j < length; j++) {
    let i = index
    indices[c++] = i + 0
    indices[c++] = i + 1
    indices[c++] = i + 2
    indices[c++] = i + 2
    indices[c++] = i + 1
    indices[c++] = i + 3
    index += 2
  }
  return indices
}
