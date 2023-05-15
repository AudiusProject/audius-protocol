import { CID } from 'multiformats/cid'
import { encode, code } from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'

/**
 * Generates CID V1 for a JSON metadata object (NOT the string of the metadata - must be an object).
 * CID<T, 512, SHA_256, 1> represents CID with json codec (512) and sha256 hash using CID V1.
 * Call toString() on the result to get the CID V1 string.
 *
 * A CID is a unique id derived by hashing the content. Originally from IPFS, it is a useful way to identify
 * pieces of content
 */
export const generateMetadataCidV1 = async (metadata: {}): Promise<CID> => {
  const bytes = encode(metadata)
  const hash = await sha256.digest(bytes)
  return CID.create(1, code, hash)
}
