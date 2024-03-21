import Hashids from 'hashids'
import { describe, afterEach, it, expect, vitest, Mock } from 'vitest'

vitest.mock('hashids')

const mockedHashids = Hashids as Mock

describe('decodeHashId', () => {
  afterEach(() => {
    vitest.resetModules()
  })

  it('can decode a hash id', async () => {
    mockedHashids.mockImplementationOnce(() => {
      return {
        decode: () => [11845]
      }
    })

    const { decodeHashId } = await import('./hashIds')

    const hashed = 'eP9k7'
    const decoded = decodeHashId(hashed)
    expect(decoded).toEqual(11845)
    expect(typeof decoded).toEqual('number')
  })

  it('can handle an error', async () => {
    const consoleErrorMock = vitest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    mockedHashids.mockImplementationOnce(() => {
      return {
        decode: () => {
          throw new Error('failed')
        }
      }
    })

    const { decodeHashId } = await import('./hashIds')

    const hashed = 'eP9k7'
    const decoded = decodeHashId(hashed)
    expect(decoded).toEqual(null)
    expect(consoleErrorMock).toHaveBeenCalled()

    consoleErrorMock.mockRestore()
  })
})
