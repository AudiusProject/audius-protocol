const axios = require('axios')

/** Sanity check for whether a user is a creator. If not, make them one. */

const hasCID = async (node, cid) => {
  const url = `${node.endpoint}/ipfs/${cid}`
  try {
    const res = await axios.head(url)
    return res.status === 200
  } catch (e) {
    return false
  }
}

const hasAllCID = async (node, cids) => {
  const hasAll = await Promise.all(cids.map(cid => hasCID(node, cid)))
  return hasAll.every(Boolean)
}

const findCorrectNode = async (nodes, cids) => {
  for (let i = 0; i < nodes.length; ++i) {
    const hasAll = await hasAllCID(nodes[i], cids)
    if (hasAll) return nodes[i]
  }
  return null
}

const isCreator = async (libs) => {
  console.debug('Sanity Check - isCreator')
  const user = libs.userStateManager.getCurrentUser()
  if (
    // There is no currently logged in user
    !user ||
    // The user has no tracks (they shouldn't become a creator)
    !user.track_count ||
    // The user is a creator and has a creator node endpoint
    (user.is_creator && user.creator_node_endpoint)
  ) return

  console.debug('Sanity Check - isCreator - Running Check')

  // Find the CIDs for all of the user's content (tracks + images)
  let cids = [
    user.profile_picture,
    user.cover_photo
  ]
  const tracks = await libs.Track.getTracks(500, 0, null, user.user_id)
  tracks.forEach(track => {
    cids.push(track.cover_art)
    cids.push(track.metadata_multihash)
    track.track_segments.forEach(segment => {
      cids.push(segment.multihash)
    })
  })
  cids = cids.filter(Boolean)

  // Check whether all the CIDs are availabile on a creator node
  const nodes = await libs.ServiceProvider.listCreatorNodes()
  const correctNode = await findCorrectNode(nodes, cids)

  // Upgrade the user to a creator
  if (correctNode) {
    try {
      console.debug('Sanity Check - isCreator - Upgrading to Creator')
      await libs.User.upgradeToCreator(null, correctNode.endpoint)
    } catch (e) {
      console.error(e)
      // We were actually a creator the whole time O_O
    }
  }
}

module.exports = isCreator
