import { readFileSync } from 'fs'
import { expect, test } from 'vitest'

import * as cheerio from 'cheerio'
import {
  DDEXPurgeRelease,
  parseDdexXmlFile,
  parseReleaseIds,
} from './parseDelivery'
import { ReleaseProcessingStatus, releaseRepo, userRepo } from './db'

test('crud', async () => {
  const grid = 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0'

  // create user for artist matching
  userRepo.upsert({
    id: 'djtheo',
    handle: 'djtheo',
    name: 'DJ Theo',
  })

  // load 01
  {
    await parseDdexXmlFile('fixtures/01_delivery.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr._parsed?.soundRecordings[0].title).toBe('Example Song')
    expect(rr.status).toBe(ReleaseProcessingStatus.Parsed)
  }

  // simulate publish
  releaseRepo.update({ key: grid, status: ReleaseProcessingStatus.Published })

  // load 02 update
  {
    await parseDdexXmlFile('fixtures/02_update.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr._parsed?.soundRecordings[0].title).toBe('Updated Example Song')
    expect(rr.status).toBe(ReleaseProcessingStatus.Parsed)
  }

  // simulate publish
  releaseRepo.update({ key: grid, status: ReleaseProcessingStatus.Published })

  // reprocess older 01 .. should be a noop
  {
    await parseDdexXmlFile('fixtures/01_delivery.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr._parsed?.soundRecordings[0].title).toBe('Updated Example Song')
    expect(rr.status).toBe(ReleaseProcessingStatus.Published)
  }

  // load 03 delete
  {
    await parseDdexXmlFile('fixtures/03_delete.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr.status).toBe(ReleaseProcessingStatus.DeletePending)
  }
})
