import { assert, describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { DOMParser } from 'linkedom'
import { queryAll, useFirstValue } from '../src/parse-ddex'
import { NodeStruct } from 'linkedom/types/mixin/parent-node'

describe('suite name', () => {
  const filePath = join(__dirname, 'fixtures', '721620118165_yt_premium.xml')
  const xmlText = readFileSync(filePath).toString()
  const document = new DOMParser().parseFromString(xmlText, 'text/xml')

  it('is xml', () => {
    assert.isTrue(xmlText.startsWith('<?xml'))
  })

  it('has message id', () => {
    const messageId = document.querySelector('MessageId')?.textContent
    assert.equal(messageId, '20170112112123022')
  })

  it('has tracks', () => {
    const sounds = queryAll(document, 'SoundRecording')
    assert.equal(sounds.length, 5)
  })

  it('has releases', () => {
    const releases = queryAll(document, 'Release')
    assert.equal(releases.length, 6)

    // first release is an album
    const mainRelease = releases[0]
    assert.equal(useFirstValue(mainRelease, 'ReleaseType'), 'Album')

    // other releases are indivdual tracks
    assert.equal(useFirstValue(releases[1], 'ReleaseType'), 'TrackRelease')

    // for main release...
    // example of resolving album track to sound recording
    {
      // first map all SoundRecording nodes by ResourceReference
      const soundsByResourceReference: Record<string, NodeStruct> = {}
      for (let s of queryAll(document, 'SoundRecording')) {
        const ref = useFirstValue(s, 'ResourceReference')
        if (ref) soundsByResourceReference[ref] = s
      }

      const mainReleaseAudioFiles: string[] = []

      // find all the pointers in release
      const mainReleaseRefs = queryAll(
        mainRelease,
        'ReleaseResourceReferenceList ReleaseResourceReference'
      )
      assert.equal(mainReleaseRefs.length, 6)

      // loop over pointers, resolve to SoundRecording
      for (const r of mainReleaseRefs) {
        const ref = r.textContent
        const sound = soundsByResourceReference[ref]
        if (!sound) {
          console.warn('failed to resolve ReleaseResourceReference', ref)
          continue
        }

        const audioFile = join(
          useFirstValue(sound, 'TechnicalSoundRecordingDetails FilePath'),
          useFirstValue(sound, 'TechnicalSoundRecordingDetails FileName')
        )
        mainReleaseAudioFiles.push(audioFile)
      }

      assert.deepEqual(mainReleaseAudioFiles, [
        'resources/721620118165_T1_001.flac',
        'resources/721620118165_T2_002.flac',
        'resources/721620118165_T3_003.flac',
        'resources/721620118165_T4_004.flac',
        'resources/721620118165_T5_005.flac'
      ])
    }
  })
})
