import Hashids from 'hashids'

// // hasher to decode / encode IDs
const hasher = new Hashids('azowernasdfoia', 5)

export function encodeId(id: number | string) {
  const num = parseInt(id as string) || id
  return hasher.encode(num as number)
}

export function decodeId(id: string) {
  return parseInt(id) || hasher.decode(id)
}

// // helper functions for content node images
export function buildImageUrls(user: any, cid: string, size: string) {
  if (!user || !user.creator_node_endpoint || !cid) return ''

  const urls = user.creator_node_endpoint
    .split(',')
    .map((u: string) => `${u}/ipfs/${cid}/${size}.jpg`)
  return urls[0]
}

// // helper functions for content node streams
// export function buildStreamUrls(user: UserRow, track: TrackRow) {
//   // when does this happen?
//   if (!user || !user.creator_node_endpoint) return []

//   const hid = encodeId(track.track_id)
//   return user.creator_node_endpoint
//     .split(',')
//     .map((u) => `${u}/tracks/stream/${hid}`)
// }
