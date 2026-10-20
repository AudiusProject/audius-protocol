import { describe, expect, it } from 'vitest'

import {
  getStemsArchiveErrorMessage,
  stemsArchiveErrorMessages
} from './stemsArchiveErrorMessage'

describe('getStemsArchiveErrorMessage', () => {
  it('shows the archiver failedReason when the job failed with one', () => {
    expect(
      getStemsArchiveErrorMessage({
        jobState: 'failed',
        failedReason: 'Track has no downloadable stems'
      })
    ).toBe('Track has no downloadable stems')
  })

  it('falls back to generic copy when the job failed without a reason', () => {
    expect(getStemsArchiveErrorMessage({ jobState: 'failed' })).toBe(
      stemsArchiveErrorMessages.generic
    )
    expect(
      getStemsArchiveErrorMessage({ jobState: 'failed', failedReason: '   ' })
    ).toBe(stemsArchiveErrorMessages.generic)
  })

  it('collapses whitespace and truncates a very long failedReason', () => {
    const message = getStemsArchiveErrorMessage({
      jobState: 'failed',
      failedReason: `line one\n\nline   two ${'x'.repeat(500)}`
    })
    expect(message.startsWith('line one line two ')).toBe(true)
    expect(message.length).toBe(200)
    expect(message.endsWith('…')).toBe(true)
  })

  it('does not say the job failed when polling timed out', () => {
    expect(
      getStemsArchiveErrorMessage({ jobState: 'active', isTimedOut: true })
    ).toBe(stemsArchiveErrorMessages.timedOut)
  })

  it('uses retryable copy when the job could not be started', () => {
    expect(getStemsArchiveErrorMessage({ initiateFailed: true })).toBe(
      stemsArchiveErrorMessages.requestFailed
    )
  })

  it('uses retryable copy when polling the job status errored', () => {
    expect(getStemsArchiveErrorMessage({ isStatusError: true })).toBe(
      stemsArchiveErrorMessages.requestFailed
    )
  })

  it('prefers the job failure over a polling error', () => {
    expect(
      getStemsArchiveErrorMessage({
        jobState: 'failed',
        failedReason: 'Out of disk space',
        isStatusError: true
      })
    ).toBe('Out of disk space')
  })

  it('never blames the connection', () => {
    const all = Object.values(stemsArchiveErrorMessages).join(' ')
    expect(all.toLowerCase()).not.toContain('connection')
  })
})
