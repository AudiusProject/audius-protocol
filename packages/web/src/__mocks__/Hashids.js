import { vitest } from 'vitest'

export const mockDecode = vitest.fn()

vitest.mock('hashids', () => {
  return vitest.fn().mockImplementation(() => {
    return { decode: mockDecode }
  })
})
