import { beforeAll, expect, test } from 'vitest'

import { ReleaseProcessingStatus, releaseRepo, userRepo } from './db'
import { parseDdexXmlFile } from './parseDelivery'
import { sources } from './sources'

beforeAll(async () => {
  sources.load('./sources.test.json')
})

test('crud', async () => {
  const grid = 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0'
  const source = 'crudTest'

  // create user for artist matching
  userRepo.upsert({
    apiKey: 'crudTestKey',
    id: 'djtheo',
    handle: 'djtheo',
    name: 'DJ Theo',
  })

  expect(userRepo.findOne({ id: 'djtheo' })).toMatchObject({
    id: 'djtheo',
    name: 'DJ Theo',
  })

  expect(
    userRepo.findOne({
      id: 'djtheo',
      apiKey: 'crudTestKey',
    })
  ).toMatchObject({
    id: 'djtheo',
    name: 'DJ Theo',
  })

  // load 01
  {
    await parseDdexXmlFile(source, 'fixtures/01_delivery.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr._parsed?.soundRecordings[0].title).toBe('Example Song')
    expect(rr.status).toBe(ReleaseProcessingStatus.PublishPending)
    expect(rr.source).toBe('crudTest')
  }

  // simulate publish
  releaseRepo.update({ key: grid, status: ReleaseProcessingStatus.Published })

  // load 02 update
  {
    await parseDdexXmlFile(source, 'fixtures/02_update.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr._parsed?.soundRecordings[0].title).toBe('Updated Example Song')
    expect(rr.status).toBe(ReleaseProcessingStatus.PublishPending)
  }

  // simulate publish
  releaseRepo.update({ key: grid, status: ReleaseProcessingStatus.Published })

  // reprocess older 01 .. should be a noop
  {
    await parseDdexXmlFile(source, 'fixtures/01_delivery.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr._parsed?.soundRecordings[0].title).toBe('Updated Example Song')
    expect(rr.status).toBe(ReleaseProcessingStatus.Published)
  }

  // load 03 delete
  {
    await parseDdexXmlFile(source, 'fixtures/03_delete.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr.status).toBe(ReleaseProcessingStatus.DeletePending)
  }

  // simulate delete
  releaseRepo.update({ key: grid, status: ReleaseProcessingStatus.Deleted })

  // re-load 03 delete... should be noop
  {
    await parseDdexXmlFile(source, 'fixtures/03_delete.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr.status).toBe(ReleaseProcessingStatus.Deleted)
  }

  // ----------------
  // no deal as takedown:
  // track is in a published state
  releaseRepo.update({
    key: grid,
    status: ReleaseProcessingStatus.Published,
    entityType: 'track',
    entityId: 't1',
  })

  // update arrives without a deal
  {
    await parseDdexXmlFile(source, 'fixtures/04_no_deal.xml')
    const rr = releaseRepo.get(grid)!
    expect(rr._parsed?.soundRecordings[0].title).toBe('Updated Example Song')
    expect(rr.status).toBe(ReleaseProcessingStatus.DeletePending)
  }
})
