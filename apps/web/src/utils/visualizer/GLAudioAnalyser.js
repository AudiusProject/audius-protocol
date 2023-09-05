import Analyser from 'web-audio-analyser'
import Texture from 'gl-texture2d'
import ndarray from 'ndarray'

export default class GLAudioAnalyser {
  constructor (gl, audio, ctx) {
    this.gl = gl
    this.audio = audio
    this.ctx = ctx

    this.waa = Analyser(this.audio, this.ctx, { audible: false })

    var size = (this.waa.analyser[0] || this.waa.analyser).frequencyBinCount

    this.waveNda = ndarray(new Float32Array(size), [size, 1])
    this.waveTex = Texture(gl, this.waveNda, { float: true })
    this.waveFlt = this.waveNda.data

    this.freqNda = ndarray(new Float32Array(size), [size, 1])
    this.freqTex = Texture(gl, this.freqNda, { float: true })
    this.freqFlt = this.freqNda.data
  }

  waveform = (channel) => {
    return this.waa.waveform(null, channel)
  }

  frequencies = (channel) => {
    return this.waa.frequencies(null, channel)
  }

  bindWaveform = (index) => {
    var wave = this.waveform()
    var waveFlt = this.waveFlt

    for (var i = 0; i < wave.length; i++) {
      waveFlt[i] = (wave[i] - 128) / 128
    }

    var retVal = this.waveTex.bind(index)
    this.waveTex.setPixels(this.waveNda)
    return retVal
  }

  bindFrequencies = (index) => {
    var freq = this.frequencies()
    var freqFlt = this.freqFlt

    for (var i = 0; i < freq.length; i++) {
      freqFlt[i] = freq[i] / 256
    }

    var retVal = this.freqTex.bind(index)
    this.freqTex.setPixels(this.freqNda)
    return retVal
  }
}
