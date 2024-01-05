import type {
  AudiusSdk as AudiusSdkType,
  Genre,
} from '@audius/sdk/dist/sdk/index.d.ts'
import type { ReleaseRowData } from '../models/dbTypes'

const queryAll = (node: any, ...fields: string[]) => {
  for (const field of fields) {
    const hits = node.querySelectorAll(field)
    if (hits.length) return Array.from(hits)
  }
  return []
}

const firstValue = (node: any, ...fields: string[]) => {
  for (const field of fields) {
    const hit = node.querySelector(field)
    if (hit) return hit.textContent.trim()
  }
}

// TODO: This function needs a lot of work!
export const getReleasesFromXml = async (
  xml: string,
  audiusSdk: AudiusSdkType
): Promise<{ release_date: Date; data: ReleaseRowData }[]> => {
  const document = new DOMParser().parseFromString(xml, 'text/xml')

  // extract SoundRecording
  const trackNodes = queryAll(document, 'SoundRecording', 'track')

  const releases: { release_date: Date; data: ReleaseRowData }[] = []

  for (const trackNode of Array.from(trackNodes)) {
    const releaseDateValue = firstValue(
      trackNode,
      'OriginalReleaseDate',
      'originalReleaseDate'
    )
    const title = firstValue(trackNode, 'TitleText', 'trackTitle')
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
    const artistName = firstValue(trackNode, 'ArtistName', 'artistName')
    const { data: users } = await audiusSdk.users.searchUsers({
      query: artistName,
    })
    if (!users || users.length === 0) {
      throw new Error(`Could not find user ${artistName}`)
    }
    const userId = users[0].id

    releases.push({
      release_date: tt.releaseDate,
      data: { ...tt, userId, artistName },
    })
  }

  // todo
  // extract Release
  // for (const releaseNode of queryAll(document, "Release", "release")) {
  // }

  return releases
}
