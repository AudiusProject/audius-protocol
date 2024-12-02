import { CID } from 'multiformats'
import { encode, code } from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'

export const generateMetadataCidV1 = async (metadata: {}): Promise<CID> => {
  const bytes = encode(metadata)
  const hash = await sha256.digest(bytes)
  return CID.create(1, code, hash)
}
