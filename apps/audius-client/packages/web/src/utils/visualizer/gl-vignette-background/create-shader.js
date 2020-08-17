import { create } from 'gl-shader-core'
import { cloneDeep } from 'lodash'

var indices = [
	'position',
	'normal',
	'color'
]
var tex = 'texcoord'

function idx(name) {
	var i = indices.indexOf(name)
	if (i !== -1)
		return i
	if (name.indexOf(tex) === 0)
		return parseInt(name.substring(tex.length), 10)|0 + 3
	return undefined
}

function remap(attribute) {
	attribute.location = idx(attribute.name)
}

module.exports = function(shader) {
	return function(gl) {
		var s = cloneDeep(shader)
		s.attributes.forEach(remap)
		return create(gl, s.vertex, s.fragment, s.uniforms, s.attributes)
	}
}