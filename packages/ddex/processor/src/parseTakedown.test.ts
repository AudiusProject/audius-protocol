import { readFileSync } from 'fs'
import { expect, test } from 'vitest'

import * as cheerio from 'cheerio'
import { parseDdexXmlFile, parseReleaseIds } from './parseDelivery'
import { releaseRepo } from './db'

test('crud', async () => {
  // load 01
  {
    await parseDdexXmlFile('fixtures/01_delivery.xml')
    const rr = releaseRepo.get('A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0')
    expect(rr?._parsed?.soundRecordings[0].title).toBe('Example Song')
  }

  // load 02 update
  {
    await parseDdexXmlFile('fixtures/02_update.xml')
    const rr = releaseRepo.get('A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0')
    expect(rr?._parsed?.soundRecordings[0].title).toBe('Updated Example Song')
  }

  // load 03 delete
  {
    const rawXml = readFileSync('fixtures/03_delete.xml', 'utf8')
    const $ = cheerio.load(rawXml, { xmlMode: true })

    const messageTs = $('MessageCreatedDateTime').first().text()
    expect(messageTs).toEqual('2024-04-02T12:00:00Z')

    const releaseIds = parseReleaseIds($('PurgedRelease').first())
    expect(releaseIds).toMatchObject({
      grid: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0',
    })
    console.log(releaseIds)
  }
})
