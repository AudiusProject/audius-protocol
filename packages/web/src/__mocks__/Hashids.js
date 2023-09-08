export const mockDecode = jest.fn()

jest.mock('hashids', () => {
  return jest.fn().mockImplementation(() => {
    return { decode: mockDecode }
  })
})
