const { handleResponse, errorResponseBadRequest, errorResponseServerError, successResponse } = require('../apiHelpers')
const authMiddleware = require('../authMiddleware')
const models = require('../models')
const { logger } = require('../logging')
const { default: Axios } = require('axios')

const MAX_REACTIONS_PER_FETCH = 100

const handleReaction = async ({ senderWallet, reactionType, reactedTo, libs, reactionValue }) => {
  const { solanaWeb3Manager } = libs
  const currentSlot = await solanaWeb3Manager.getSlot()

  // Get reactions on DN
  const { discoveryProviderEndpoint } = libs.discoveryProvider
  const url = `${discoveryProviderEndpoint}/v1/full/tips`
  const resp = await Axios({
    method: 'get',
    url,
    params: {
      tx_signatures: reactedTo
    }
  })

  const tips = resp.data.data

  if (tips.length !== 1) {
    // Can't react to something that doesn't exist
    throw new Error(`No tip for tx_id ${reactedTo}`)
  }

  const { erc_wallet: tipReceiverWallet } = tips[0].receiver
  if (tipReceiverWallet != senderWallet) {
    throw new Error(`Can't react unless user was the tip recipient`)
  }

  // https://discoveryprovider.staging.audius.co/v1/full/tips?tx_signatures=5M8kT9t5kqwKBR78eBGwdghm11msarztmRGq2Mo63rQbtMhV5PvLUozGWiwobpE74KiVTLG9zSPkdQESeEkQcVVv
  // {"data": [{"reaction_value": "3", "reaction_type": "tip", "sender_user_id": "dO05y", "reacted_to": "3o59LhAGG62jo5uZAiAgpQGujM7qCxxQsGU6hzUisTUyPe1t3DnvSb2A6Wgu2gdpgzTWimdgEu2y5CeXKQT3zDUp"}]}
  // {"latest_chain_block": 27108793, "latest_indexed_block": 27108793, "latest_chain_slot_plays": 143473866, "latest_indexed_slot_plays": 143473866, "signature": "0x25424422c98a55da600092063cc9e5ece7a0025e0adf66f77d09f044d4a08ada295321ba97bc108290333b06bcd4a7f7f970cbb6fa74b99a61aa0233021d40cb1c", "timestamp": "2022-07-28T06:00:48.201Z", "version": {"service": "discovery-node", "version": "0.3.62"}, "data": [{"amount": "1000000000000000000", "sender": {"album_count": 1, "bio": "Test bio making this a bit larger, a bit larger a bit larger, a bit larger still, wow this is getting to be over three lines! ,a link https://audius.co", "cover_photo": {"640x": "https://creatornode8.staging.audius.co/ipfs/QmcC7j46FevH2uahSayZAzc3buV1jpWShkEWK3M3nvXk4U/640x.jpg", "2000x": "https://creatornode8.staging.audius.co/ipfs/QmcC7j46FevH2uahSayZAzc3buV1jpWShkEWK3M3nvXk4U/2000x.jpg"}, "followee_count": 9, "follower_count": 3, "does_follow_current_user": false, "handle": "durandylan", "id": "eb2qX", "is_verified": false, "location": "San Francisco, CA", "name": "DuranDylan", "playlist_count": 0, "profile_picture": null, "repost_count": 1, "track_count": 3, "is_deactivated": false, "erc_wallet": "0xce74afc7b8d71901a666cc717cd6d045b3ae1845", "spl_wallet": "5xHKyg2ZsiQc5JUQA2su4GqJm6Nqo3FhVXWaYdUUYoZj", "supporter_count": 0, "supporting_count": 3, "balance": "0", "associated_wallets_balance": "0", "total_balance": "1000000000000000000", "waudio_balance": "100000000", "associated_sol_wallets_balance": "0", "blocknumber": 27107782, "wallet": "0xce74afc7b8d71901a666cc717cd6d045b3ae1845", "created_at": "2022-01-04 00:22:45", "creator_node_endpoint": "https://creatornode8.staging.audius.co,https://creatornode10.staging.audius.co,https://creatornode9.staging.audius.co", "current_user_followee_follow_count": 0, "does_current_user_follow": false, "handle_lc": "durandylan", "updated_at": "2022-07-28 00:47:25", "cover_photo_sizes": "QmcC7j46FevH2uahSayZAzc3buV1jpWShkEWK3M3nvXk4U", "cover_photo_legacy": null, "profile_picture_sizes": null, "profile_picture_legacy": null, "metadata_multihash": "QmdRDMbKi2HRshdkq4SUzbFR42qPtGfpChEyZ5U6Hdp7Ln", "has_collectibles": false, "playlist_library": null}, "receiver": {"album_count": 0, "bio": "abc", "cover_photo": {"640x": "https://usermetadata.staging.audius.co/ipfs/QmXw5LZtrHZ4X167dJ9VEpFaNmLspPueTmnLZcfsbUAAXJ/640x.jpg", "2000x": "https://usermetadata.staging.audius.co/ipfs/QmXw5LZtrHZ4X167dJ9VEpFaNmLspPueTmnLZcfsbUAAXJ/2000x.jpg"}, "followee_count": 8, "follower_count": 1, "does_follow_current_user": false, "handle": "m500", "id": "PQZvp", "is_verified": false, "location": "Queens, NY", "name": "m500", "playlist_count": 0, "profile_picture": {"150x150": "https://usermetadata.staging.audius.co/ipfs/QmVAnmwHbqYXkFj3cFzSVpW2eyMKSYi3fYL1tk35k8ejae/150x150.jpg", "480x480": "https://usermetadata.staging.audius.co/ipfs/QmVAnmwHbqYXkFj3cFzSVpW2eyMKSYi3fYL1tk35k8ejae/480x480.jpg", "1000x1000": "https://usermetadata.staging.audius.co/ipfs/QmVAnmwHbqYXkFj3cFzSVpW2eyMKSYi3fYL1tk35k8ejae/1000x1000.jpg"}, "repost_count": 1, "track_count": 3, "is_deactivated": false, "erc_wallet": "0x85cdf1076153c7d1769a7e814d07f92356a7ccbc", "spl_wallet": "FmMFNEkqaAvNijDmspPyGEEda9kaMfhar5KQs2Aqyqpf", "supporter_count": 3, "supporting_count": 11, "balance": "0", "associated_wallets_balance": "0", "total_balance": "26000000000000000000", "waudio_balance": "2600000000", "associated_sol_wallets_balance": "0", "blocknumber": 27068486, "wallet": "0x85cdf1076153c7d1769a7e814d07f92356a7ccbc", "created_at": "2022-05-26 00:11:30", "creator_node_endpoint": "https://usermetadata.staging.audius.co,https://creatornode5.staging.audius.co,https://creatornode6.staging.audius.co", "current_user_followee_follow_count": 0, "does_current_user_follow": false, "handle_lc": "m500", "updated_at": "2022-07-19 22:47:00", "cover_photo_sizes": "QmXw5LZtrHZ4X167dJ9VEpFaNmLspPueTmnLZcfsbUAAXJ", "cover_photo_legacy": null, "profile_picture_sizes": "QmVAnmwHbqYXkFj3cFzSVpW2eyMKSYi3fYL1tk35k8ejae", "profile_picture_legacy": null, "metadata_multihash": "QmbsWgNSJQnYyEsH1bxd5iWnJ7PUtbRoftiYfLvM7xakHp", "has_collectibles": false, "playlist_library": null}, "created_at": "2022-07-18 02:49:05", "slot": 142039377, "followee_supporters": [], "tx_signature": "5M8kT9t5kqwKBR78eBGwdghm11msarztmRGq2Mo63rQbtMhV5PvLUozGWiwobpE74KiVTLG9zSPkdQESeEkQcVVv"}]}

  const now = Date.now()
  await models.Reactions.create({
    slot: currentSlot,
    reactionValue,
    senderWallet,
    reactionType,
    reactedTo,
    createdAt: now,
    updatedAt: now
  })
}

const getReactions = async ({ startIndex, limit }) => {
  const reactions = await models.Reactions.findAll({
    where: {
      id: { [models.Sequelize.Op.gte]: startIndex }
    },
    order: [[models.Sequelize.col('id'), 'ASC']],
    limit
  })
  return reactions
}

module.exports = function (app) {
  /**
   * POST a new reaction, represented by a numeric ID (reaction) and reactedTo (entity being reacted upon)
   */
  app.post('/reactions', authMiddleware, handleResponse(async (req, res, next) => {
    // Validation
    const senderWallet = req.user.walletAddress
    const { reactedTo, reactionValue } = req.body

    if (!senderWallet || !reactedTo || reactionValue === undefined) return errorResponseBadRequest(`Missing argument: ${JSON.stringify({ senderWallet, reactedTo, reactionValue })}`)

    const parsedReaction = parseInt(reactionValue)
    if (isNaN(parsedReaction)) return errorResponseBadRequest('Invalid reaction type')

    const libs = req.app.get('audiusLibs')

    try {
      logger.info(`Creating reaction ${reactionValue} for reactedTo: ${reactedTo}`)
      await handleReaction({ senderWallet, reactedTo, reactionValue: parsedReaction, reactionType: 'tip', libs })
      return successResponse()
    } catch (e) {
      logger.error(`Caught error trying to create reaction ${reactionValue} for id: ${reactedTo}: ${e}`)
      return errorResponseServerError('Something went wrong')
    }
  }))

  /**
   * Get all reactions with ID >= startIndex
   */
  app.get('/reactions', handleResponse(async (req, res, next) => {
    let { startIndex, limit } = req.query
    startIndex = startIndex || 0
    limit = Math.min(MAX_REACTIONS_PER_FETCH, limit || MAX_REACTIONS_PER_FETCH)

    try {
      const reactions = await getReactions({ startIndex, limit })
      return successResponse({
        reactions
      })
    } catch (e) {
      logger.error(`Caught error trying to get reactions: ${e}`)
      return errorResponseServerError('Something went wrong')
    }
  }))
}
