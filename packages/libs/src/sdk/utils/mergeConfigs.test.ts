import { expect, describe, test } from '@jest/globals'

import { mergeConfigWithDefaults } from './mergeConfigs'

describe('merge configs', () => {
  test("doesn't merge arrays", () => {
    expect(
      mergeConfigWithDefaults({ a: ['foo'] }, { a: ['bar'] })
    ).toMatchObject({
      a: ['foo']
    })
  })

  test('merges deep properties', () => {
    expect(
      mergeConfigWithDefaults(
        { a: { b: 'foo' } },
        { a: { b: 'baz', c: 'bar' } }
      )
    ).toMatchObject({ a: { b: 'foo', c: 'bar' } })
  })

  test('passes real use case', () => {
    expect(
      mergeConfigWithDefaults(
        {
          healthCheckThresholds: {
            minVersion: '1.2.3'
          },
          bootstrapServices: [
            'https://healthy.audius.co',
            'https://behind-blockdiff.audius.co',
            'https://behind-largeblockdiff.audius.co',
            'https://behind-patchversion.audius.co',
            'https://behind-minorversion.audius.co',
            'https://unhealthy0.audius.co',
            'https://unhealthy1.audius.co',
            'https://unhealthy2.audius.co',
            'https://unhealthy3.audius.co',
            'https://unhealthy4.audius.co'
          ]
        },
        {
          initialSelectedNode: null,
          blocklist: null,
          allowlist: null,
          maxConcurrentRequests: 6,
          requestTimeout: 30000,
          unhealthyTTL: 3600000,
          backupsTTL: 120000,
          cacheTTL: 600000,
          healthCheckThresholds: {
            minVersion: '0.3.72',
            maxSlotDiffPlays: null,
            maxBlockDiff: 15
          },
          bootstrapServices: [
            'https://discoveryprovider3.audius.co',
            'https://discoveryprovider2.audius.co',
            'https://discoveryprovider.audius.co'
          ]
        }
      )
    ).toMatchObject({
      initialSelectedNode: null,
      blocklist: null,
      allowlist: null,
      maxConcurrentRequests: 6,
      requestTimeout: 30000,
      unhealthyTTL: 3600000,
      backupsTTL: 120000,
      cacheTTL: 600000,
      healthCheckThresholds: {
        minVersion: '1.2.3',
        maxSlotDiffPlays: null,
        maxBlockDiff: 15
      },
      bootstrapServices: [
        'https://healthy.audius.co',
        'https://behind-blockdiff.audius.co',
        'https://behind-largeblockdiff.audius.co',
        'https://behind-patchversion.audius.co',
        'https://behind-minorversion.audius.co',
        'https://unhealthy0.audius.co',
        'https://unhealthy1.audius.co',
        'https://unhealthy2.audius.co',
        'https://unhealthy3.audius.co',
        'https://unhealthy4.audius.co'
      ]
    })
  })
})
