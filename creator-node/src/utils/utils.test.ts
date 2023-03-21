// eslint-disable-next-line node/no-unpublished-import
import chai from 'chai'
import { getCharsInRange, getCharsInRanges } from './utils'
const { expect } = chai

describe('Test utils', () => {
  it('getCharsInRange should return a-z in inclusive range', () => {
    expect(getCharsInRange('a', 'g')).to.eql([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g'
    ])
  })

  it('getCharsInRanges should maintain order between ranges', () => {
    expect(getCharsInRanges('ag', 'AG')).to.eql([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G'
    ])
  })
})
