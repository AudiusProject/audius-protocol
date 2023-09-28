import Hashids from 'hashids'

// hasher to decode / encode IDs
const hasher = new Hashids('azowernasdfoia', 5)

export function encodeId(id: number | string) {
  const num = parseInt(id as string) || id
  return hasher.encode(num as number)
}

export function decodeId(id: string) {
  return hasher.decode(id)
}

// helper functions for content node images
export function buildImageUrls(user: any, cid: string, size: string) {
  if (!user || !user.creator_node_endpoint || !cid) return ''

  const urls = user.creator_node_endpoint
    .split(',')
    .map((u: string) => `${u}/ipfs/${cid}/${size}.jpg`)
  return urls[0]
}
