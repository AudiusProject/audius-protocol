import { describe, it, expect, vi } from 'vitest'

import { createLazyLoader } from './lazy'

describe('createLazyLoader', () => {
  it('loads once for concurrent callers', async () => {
    const load = vi.fn(async () => ({ value: 1 }))
    const loader = createLazyLoader(load)
    expect(loader.peek()).toBeUndefined()

    const [a, b] = await Promise.all([loader.get(), loader.get()])
    expect(a).toBe(b)
    expect(await loader.get()).toBe(a)
    expect(loader.peek()).toBe(a)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('propagates errors and retries on the next call', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValueOnce('ok')
    const loader = createLazyLoader(load)

    await expect(loader.get()).rejects.toThrow('chunk failed')
    expect(loader.peek()).toBeUndefined()
    await expect(loader.get()).resolves.toBe('ok')
    expect(load).toHaveBeenCalledTimes(2)
  })
})
