export enum BedtimeFormat {
  TRACK = 'TRACK',
  COLLECTION = 'COLLECTION'
}

export interface TrackResponse {
  id: number
  title: string
  handle: string
  userName: string
  isVerified: boolean
  segments: Array<{ duration: number, multihash: string }>
  urlPath: string
  gateways: string
}

export type GetTracksResponse = TrackResponse & {
  coverArt: string
}

export interface GetCollectionResponse {
  id: number
  name: string
  ownerHandle: string
  ownerName: string
  collectionURLPath: string
  tracks: TrackResponse[]
  coverArt: string
  isVerified: boolean
  gateways: string
}
