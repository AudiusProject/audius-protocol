export enum BedtimeFormat {
  TRACK = 'TRACK',
  COLLECTION = 'COLLECTION'
}

export type TrackResponse = {
  id: number
  title: string
  handle: string
  userName: string
  isVerified: boolean
  segments: Array<{ duration: number, multihash: string }>
  urlPath: string
}

export type GetTracksResponse = TrackResponse & {
  coverArt: string
}

export type GetCollectionResponse = {
  id: number
  name: string
  ownerHandle: string
  ownerName: string
  collectionURLPath: string
  tracks: TrackResponse[]
  coverArt: string
  isVerified: boolean
}
