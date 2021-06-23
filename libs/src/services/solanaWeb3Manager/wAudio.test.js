const BN = require('bn.js')
const assert = require('assert')

const { wAudioFromWeiAudio } = require('./wAudio')

describe('wAudioFromWeiAudio', () => {
  it('throws if the amount is below the minimum', () => {
    const weiAudio = new BN('1')
    assert.throws(() => wAudioFromWeiAudio(weiAudio))
  })
  it('throws if the amount too precise', () => {
    const weiAudio = new BN('1000000001')
    assert.throws(() => wAudioFromWeiAudio(weiAudio))
  })
  it('converts if the amount equals the minimum', () => {
    const weiAudio = new BN('1000000000')
    const wAudio = wAudioFromWeiAudio(weiAudio)
    assert.ok(wAudio.eq(new BN('1')))
  })
  it('converts if the amount is valid', () => {
    const weiAudio = new BN('1024000000000') // 1024 * 10^-9 $AUDIO
    const wAudio = wAudioFromWeiAudio(weiAudio)
    assert.ok(wAudio.eq(new BN('1024')))
  })
  it('converts if the amount is large and valid', () => {
    const weiAudio = new BN('49000000000000000000') // 49 $AUDIO
    const wAudio = wAudioFromWeiAudio(weiAudio)
    assert.ok(wAudio.eq(new BN('49000000000')))
  })
})
