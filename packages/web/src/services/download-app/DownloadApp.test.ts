import { OS } from '@audius/common/models'
import fetchMock from 'fetch-mock'
import { describe, it, beforeAll, expect } from 'vitest'

import { getDownloadLinkForSystem } from './DownloadApp'

const LATEST_MAC = `version: 0.20.4
files:
  - url: Audius-0.20.4-mac.zip
    sha512: 4a/VRp3LTzQzbbiX4e2QGVj/KNuN7HDBKoa7+PcHrNrVjHGzDcSM2Drybe0farC/GsAKd/L8FNlGFJbN1EOSWA==
    size: 156646506
    blockMapSize: 164409
  - url: Audius-0.20.4.dmg
    sha512: 1J4eUmoAmGHniD22DnL4XrOPMuGwy3EGn1GTnPRGfBu5vBlzvRn1ofShza0xTL+Is3bPo5ubyA9mtjpcB93Lzg==
    size: 163761342
path: Audius-0.20.4-mac.zip
sha512: 4a/VRp3LTzQzbbiX4e2QGVj/KNuN7HDBKoa7+PcHrNrVjHGzDcSM2Drybe0farC/GsAKd/L8FNlGFJbN1EOSWA==
releaseDate: '2020-04-24T21:39:02.531Z'
`

const LATEST_WIN = `version: 0.20.4
files:
  - url: Audius Setup 0.20.4.exe
    sha512: WCi8hqXlvxeEUgh4D482l9rBJYvForj2IkVRQF+jKgYevavv5i2lkywJo07DtjgWwvE5GScPf/lyzg1idVeoBg==
    size: 113015920
path: Audius Setup 0.20.4.exe
sha512: WCi8hqXlvxeEUgh4D482l9rBJYvForj2IkVRQF+jKgYevavv5i2lkywJo07DtjgWwvE5GScPf/lyzg1idVeoBg==
releaseDate: '2020-04-24T21:33:38.513Z'
`

const LATEST_LINUX = `version: 0.20.4
files:
  - url: Audius 0.20.4.AppImage
    sha512: 8BWWhHkuFspyr+lqtYGyzOV2iohsoz7aatPyUfgbVR+iX+6PzUD0CWtF/1bsYtavhOITSKsiVpoanvZXoeufxA==
    size: 151031648
    blockMapSize: 157860
path: Audius 0.20.4.AppImage
sha512: 8BWWhHkuFspyr+lqtYGyzOV2iohsoz7aatPyUfgbVR+iX+6PzUD0CWtF/1bsYtavhOITSKsiVpoanvZXoeufxA==
releaseDate: '2019-10-04T21:13:43.777Z'
`

describe('can create a download link', () => {
  beforeAll(() => {
    fetchMock.get('https://download.audius.co/latest-mac.yml', LATEST_MAC)
    fetchMock.get('https://download.audius.co/latest.yml', LATEST_WIN)
    fetchMock.get('https://download.audius.co/latest-linux.yml', LATEST_LINUX)
  })
  it('works for mac osx', async () => {
    const link = await getDownloadLinkForSystem(OS.MAC)
    expect(link).toEqual('https://download.audius.co/Audius-0.20.4.dmg')
  })
  it('works for windows', async () => {
    const link = await getDownloadLinkForSystem(OS.WIN)
    expect(link).toEqual('https://download.audius.co/Audius Setup 0.20.4.exe')
  })
  it('works for linux', async () => {
    const link = await getDownloadLinkForSystem(OS.LINUX)
    expect(link).toEqual('https://download.audius.co/Audius 0.20.4.AppImage')
  })
})
