import { beforeAll, expect, test } from 'vitest'
import {
  DDEXRelease,
  DealEthGated,
  DealFollowGated,
  DealPayGated,
  DealSolGated,
  parseDdexXmlFile,
} from './parseDelivery'
import { sources } from './sources'

beforeAll(async () => {
  sources.load('./sources.test.json')
})

test('deal types', async () => {
  const releases = (await parseDdexXmlFile(
    'dealTest',
    'fixtures/dealTypes.xml'
  )) as DDEXRelease[]

  expect(releases[1].deal).toMatchObject<Partial<DealPayGated>>({
    audiusDealType: 'PayGated',
    priceUsd: 4.0,
    isDownloadable: true,
  })

  expect(releases[2].deal).toMatchObject<Partial<DealFollowGated>>({
    audiusDealType: 'FollowGated',
    isDownloadable: false,
  })

  expect(releases[3].deal).toMatchObject<Partial<DealEthGated>>({
    audiusDealType: 'NFTGated',
    isDownloadable: false,
    chain: 'eth',
    standard: 'ERC-721',
  })

  expect(releases[4].deal).toMatchObject<Partial<DealSolGated>>({
    audiusDealType: 'NFTGated',
    isDownloadable: false,
    chain: 'sol',
  })

  // cline
  expect(releases[1].copyrightLine).toMatchObject({
    text: '(C) 2010 Iron Crown Music',
    year: '2010',
  })
  expect(releases[1].soundRecordings[0].copyrightLine).toBeUndefined()
})
