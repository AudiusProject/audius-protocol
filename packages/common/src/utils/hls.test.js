import { generateM3U8, generateM3U8Variants } from './hls'

jest.mock('services/audius-backend', () => ({
  fetchCID: (multihash) => multihash
}))

describe('generate m3u8', () => {
  it('can generate an m3u8', () => {
    const m3u8 = generateM3U8([
      {
        multihash: 'Q111',
        duration: 5.99
      },
      {
        multihash: 'Q222',
        duration: 6.01
      }
    ])

    expect(m3u8).toEqual(
      `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:5.99
Q111
#EXTINF:6.01
Q222
#EXT-X-ENDLIST`
    )
  })

  it('can use a prefetched URL', () => {
    const m3u8 = generateM3U8(
      [
        {
          multihash: 'Q111',
          duration: 5.99
        },
        {
          multihash: 'Q222',
          duration: 6.01
        }
      ],
      ['blob:http://localhost:3000/Q111']
    )

    expect(m3u8).toEqual(
      `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:5.99
blob:http://localhost:3000/Q111
#EXTINF:6.01
Q222
#EXT-X-ENDLIST`
    )
  })

  it('uses a gateway override', () => {
    const m3u8 = generateM3U8(
      [
        {
          multihash: 'Q111',
          duration: 5.99
        },
        {
          multihash: 'Q222',
          duration: 6.01
        }
      ],
      [],
      'https://ipfs.io/ipfs/'
    )

    expect(m3u8).toEqual(
      `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:5.99
https://ipfs.io/ipfs/Q111
#EXTINF:6.01
https://ipfs.io/ipfs/Q222
#EXT-X-ENDLIST`
    )
  })
})

describe('generates m3u8 master with variants', () => {
  it('can generate an m3u8 master with variants', () => {
    const m3u8 = generateM3U8Variants(
      [
        {
          multihash: 'Q111',
          duration: 5.99
        },
        {
          multihash: 'Q222',
          duration: 6.01
        }
      ],
      [],
      ['https://ipfs.io/ipfs/', 'https://example.com/ipfs/']
    )

    expect(m3u8).toEqual(
      `data:application/vnd.apple.mpegURL;base64,I0VYVE0zVQojRVhULVgtVkVSU0lPTjozCiNFWFQtWC1TVFJFQU0tSU5GOlRZUEU9QVVESU8sQkFORFdJRFRIPTY1MDAwLENPREVDUz0ibXA0YS40MC4yIgpkYXRhOmFwcGxpY2F0aW9uL3ZuZC5hcHBsZS5tcGVnVVJMO2Jhc2U2NCxJMFZZVkUwelZRb2pSVmhVTFZndFZrVlNVMGxQVGpvekNpTkZXRlF0V0MxVVFWSkhSVlJFVlZKQlZFbFBUam8yQ2lORldGUXRXQzFOUlVSSlFTMVRSVkZWUlU1RFJUb3dDaU5GV0ZSSlRrWTZOUzQ1T1Fwb2RIUndjem92TDJsd1puTXVhVzh2YVhCbWN5OVJNVEV4Q2lORldGUkpUa1k2Tmk0d01RcG9kSFJ3Y3pvdkwybHdabk11YVc4dmFYQm1jeTlSTWpJeUNpTkZXRlF0V0MxRlRrUk1TVk5VCiNFWFQtWC1TVFJFQU0tSU5GOlRZUEU9QVVESU8sQkFORFdJRFRIPTY1MDAwLENPREVDUz0ibXA0YS40MC4yIgpkYXRhOmFwcGxpY2F0aW9uL3ZuZC5hcHBsZS5tcGVnVVJMO2Jhc2U2NCxJMFZZVkUwelZRb2pSVmhVTFZndFZrVlNVMGxQVGpvekNpTkZXRlF0V0MxVVFWSkhSVlJFVlZKQlZFbFBUam8yQ2lORldGUXRXQzFOUlVSSlFTMVRSVkZWUlU1RFJUb3dDaU5GV0ZSSlRrWTZOUzQ1T1Fwb2RIUndjem92TDJWNFlXMXdiR1V1WTI5dEwybHdabk12VVRFeE1Rb2pSVmhVU1U1R09qWXVNREVLYUhSMGNITTZMeTlsZUdGdGNHeGxMbU52YlM5cGNHWnpMMUV5TWpJS0kwVllWQzFZTFVWT1JFeEpVMVE9`
    )
  })
})
