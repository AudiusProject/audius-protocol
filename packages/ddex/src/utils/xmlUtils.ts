import type {
  AudiusSdk as AudiusSdkType,
  Genre,
} from '@audius/sdk/dist/sdk/index.d.ts'
import type { ReleaseRowData } from '../models/dbTypes'

import { XMLParser } from 'fast-xml-parser'

export const getReleasesFromXml = async (
  xml: string,
  audiusSdk: AudiusSdkType
): Promise<{ release_date: Date; data: ReleaseRowData }[]> => {
  try {
    const parser = new XMLParser({ ignoreAttributes: false })
    const result = parser.parse(xml)

    const trackNodes = result.release.tracks.track

    // TODO: This should really be mapping result.release, not result.release.tracks.track
    const releasePromises = trackNodes.map(async (trackNode: any) => {
      const releaseDateValue =
        trackNode.OriginalReleaseDate || trackNode.originalReleaseDate
      const title = trackNode.TitleText || trackNode.trackTitle
      const tt = {
        title,

        // todo: need to normalize genre
        // genre: firstValue(trackNode, "Genre", "trackGenre"),
        genre: 'Metal' as Genre,

        // todo: need to parse release date if present
        releaseDate: new Date(releaseDateValue as string | number | Date),
        // releaseDate: new Date(),

        isUnlisted: false,
        isPremium: false,
        fieldVisibility: {
          genre: true,
          mood: true,
          tags: true,
          share: true,
          play_count: true,
          remixes: true,
        },
        description: '',
        license: 'Attribution ShareAlike CC BY-SA',
      }
      const artistName = trackNode.trackArtists.artistName[0]
      const { data: users } = await audiusSdk.users.searchUsers({
        query: artistName,
      })
      if (!users || users.length === 0) {
        throw new Error(`Could not find user ${artistName}`)
      }
      const userId = users[0].id

      return {
        release_date: new Date(releaseDateValue),
        data: { ...tt, userId, artistName },
      }
    })

    const releases = await Promise.all(releasePromises)
    return releases
  } catch (error) {
    throw new Error(`Error parsing XML: ${error}`)
  }
}
