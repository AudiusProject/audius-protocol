import { describe, test, expect } from 'vitest'

import { getAAOErrorEmojis } from './aaoErrorCodes'

describe('aaErrorCodes', () => {
  test('returns the correct emoji', () => {
    expect(getAAOErrorEmojis(0)).toBe('😓')
  })
})
