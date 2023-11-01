import Hashids from 'hashids'

jest.mock('hashids')

describe('decodeHashId', () => {
  afterEach(() => {
    jest.resetModules()
  })

  it('can decode a hash id', () => {
    Hashids.mockImplementationOnce(() => {
      return {
        decode: () => [11845]
      }
    })

    const { decodeHashId } = require('./hashIds')

    const hashed = 'eP9k7'
    const decoded = decodeHashId(hashed)
    expect(decoded).toEqual(11845)
    expect(typeof decoded).toEqual('number')
  })

  it('can handle an error', () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()
    Hashids.mockImplementationOnce(() => {
      return {
        decode: () => []
      }
    })

    const { decodeHashId } = require('./hashIds')

    const hashed = 'eP9k7'
    const decoded = decodeHashId(hashed)
    expect(decoded).toEqual(null)
    expect(consoleErrorMock).toHaveBeenCalled()

    consoleErrorMock.mockRestore()
  })
})
