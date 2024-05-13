import { beforeAll, expect, test } from 'vitest'
import {
  DDEXRelease,
  DealEthGated,
  DealFollowGated,
  DealPayGated,
  DealSolGated,
  DealTipGated,
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

  expect(releases[1].deals[0]).toMatchObject<Partial<DealPayGated>>({
    audiusDealType: 'PayGated',
    priceUsd: 4.0,
    forDownload: true,
  })

  expect(releases[2].deals[0]).toMatchObject<Partial<DealFollowGated>>({
    audiusDealType: 'FollowGated',
    forDownload: false,
  })

  expect(releases[3].deals[0]).toMatchObject<Partial<DealEthGated>>({
    audiusDealType: 'NFTGated',
    forDownload: false,
    chain: 'eth',
    standard: 'ERC-721',
  })

  expect(releases[4].deals[0]).toMatchObject<Partial<DealSolGated>>({
    audiusDealType: 'NFTGated',
    forDownload: false,
    chain: 'sol',
  })

  // cline
  expect(releases[1].copyrightLine).toMatchObject({
    text: '(C) 2010 Iron Crown Music',
    year: '2010',
  })
  expect(releases[1].soundRecordings[0].copyrightLine).toBeUndefined()
})

test('separate stream / download deal conditions', async () => {
  const releases = (await parseDdexXmlFile(
    'dealTest',
    'fixtures/track_follow_gated.xml'
  )) as DDEXRelease[]

  expect(releases[0].deals[0]).toMatchObject<Partial<DealFollowGated>>({
    audiusDealType: 'FollowGated',
    forStream: true,
    forDownload: false,
  })

  expect(releases[0].deals[1]).toMatchObject<Partial<DealTipGated>>({
    audiusDealType: 'TipGated',
    forStream: false,
    forDownload: true,
  })
})
