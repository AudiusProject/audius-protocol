export enum BedtimeFormat {
  TRACK = 'TRACK',
  COLLECTION = 'COLLECTION'
}

export type TrackResponse = {
  id: number
  title: string
  handle: string
  userName: string
  segments: { duration: number, multihash: string }[]
  urlPath: string
}

export type GetTracksResponse = TrackResponse & {
  isVerified: boolean,
  coverArt: string
}

export type GetCollectionResponse = {
  name: string
  ownerHandle: string
  ownerName: string
  collectionURLPath: string
  tracks: TrackResponse[]
  coverArt: string
}

