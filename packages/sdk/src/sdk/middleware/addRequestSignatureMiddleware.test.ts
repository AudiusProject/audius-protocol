import { describe, it, expect } from 'vitest'

import { createAppWalletClient, Logger } from '../services'

import { addRequestSignatureMiddleware } from './addRequestSignatureMiddleware'

describe('addRequestSignatureMiddleware', () => {
  it('generates a signature', async () => {
    const services = {
      audiusWalletClient: createAppWalletClient(
        '0x',
        '0x4ac8b3eff248bfbf20b324b575c1b333d42c6db3dbe19fd587c3d1e11323a25a'
      ),
      logger: new Logger()
    }
    const m = addRequestSignatureMiddleware({ services })
    const ctx = await m.pre?.({
      fetch,
      url: 'example.com',
      init: {
        headers: {
          'x-something': 'value'
        }
      }
    })
    expect(ctx?.init.headers).toHaveProperty('Encoded-Data-Message')
    expect((ctx?.init.headers as any)['Encoded-Data-Message']).toContain(
      'signature'
    )
    expect(ctx?.init.headers).toHaveProperty('Encoded-Data-Signature')
  })

  it('reuses a signature', async () => {
    const services = {
      audiusWalletClient: createAppWalletClient(
        '0x',
        '0x4ac8b3eff248bfbf20b324b575c1b333d42c6db3dbe19fd587c3d1e11323a25a'
      ),
      logger: new Logger()
    }
    const m = addRequestSignatureMiddleware({ services })
    const ctx = await m.pre?.({
      fetch,
      url: 'example.com',
      init: {
        headers: {
          'x-something': 'value'
        }
      }
    })
    const message = (ctx?.init.headers as any)['Encoded-Data-Message']
    const signature = (ctx?.init.headers as any)['Encoded-Data-Signature']

    const ctx2 = await m.pre?.({
      fetch,
      url: 'example2.com',
      init: {
        headers: {
          'x-something': 'value'
        }
      }
    })
    expect((ctx2?.init.headers as any)['Encoded-Data-Message']).toEqual(message)
    expect((ctx2?.init.headers as any)['Encoded-Data-Signature']).toEqual(
      signature
    )
  })
})
