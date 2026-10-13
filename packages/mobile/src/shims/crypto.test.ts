// eslint-disable-next-line @typescript-eslint/no-var-requires
const shim = require('./crypto')

describe('crypto shim', () => {
  beforeAll(() => {
    ;(global as any).crypto = require('crypto').webcrypto
  })

  it('returns random bytes larger than one getRandomValues call', () => {
    const bytes = shim.randomBytes(70000)
    expect(Buffer.isBuffer(bytes)).toBe(true)
    expect(bytes.length).toBe(70000)
    expect(bytes.subarray(66000).some((b: number) => b !== 0)).toBe(true)
  })

  it('supports the callback form', async () => {
    const bytes = await new Promise<Buffer>((resolve, reject) =>
      shim.randomBytes(16, (err: Error | null, result: Buffer) =>
        err ? reject(err) : resolve(result)
      )
    )
    expect(bytes.length).toBe(16)
  })

  it('hashes, HMACs, derives and encrypts like Node', () => {
    expect(shim.createHash('sha256').update('abc').digest('hex')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
    expect(shim.createHmac('sha256', 'key').update('abc').digest('hex')).toBe(
      require('crypto').createHmac('sha256', 'key').update('abc').digest('hex')
    )
    expect(
      shim.pbkdf2Sync('pw', 'salt', 10, 32, 'sha256').toString('hex')
    ).toBe(
      require('crypto')
        .pbkdf2Sync('pw', 'salt', 10, 32, 'sha256')
        .toString('hex')
    )
    const key = Buffer.alloc(16, 1)
    const iv = Buffer.alloc(16, 2)
    const cipher = shim.createCipheriv('aes-128-ctr', key, iv)
    const encrypted = Buffer.concat([cipher.update('hello'), cipher.final()])
    const decipher = require('crypto').createDecipheriv('aes-128-ctr', key, iv)
    expect(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
    ).toBe('hello')
  })
})
