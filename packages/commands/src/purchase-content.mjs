import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusLibs } from './utils.mjs'

program
  .command('purchase-content')
  .description('Purchases a track or album using USDC')
  .argument('<id>', 'The track_id or playlist_id to purchase')
  .option('-f, --from [from]', 'The account purchasing the content (handle)')
  .option('-t, --type [type]', 'The content type to purchase (album or track)')
  .option(
    '-e, --extra-amount [amount]',
    'Extra amount to pay in addition to the price (in cents)'
  )
  .action(async (contentId, { from, type, extraAmount: extraAmountCents }) => {
    type = type || 'track'
    const audiusLibs = await initializeAudiusLibs(from)
    const user = audiusLibs.userStateManager.getCurrentUser()

    let blocknumber
    let streamConditions
    if (type === 'track') {
      const track = (await audiusLibs.Track.getTracks(100, 0, [contentId]))[0]
      if (!track.stream_conditions || !track.is_stream_gated) {
        program.error('Track is not stream gated')
      }
      if (!track.stream_conditions?.usdc_purchase?.splits) {
        program.error('Track is not purchaseable')
      }
      blocknumber = track.blocknumber
      streamConditions = track.stream_conditions
    } else if (type === 'album') {
      const album = (
        await audiusLibs.Playlist.getPlaylists(100, 0, [contentId])
      )[0]
      if (!album.is_album) {
        program.error('Playlist is not an album')
      }
      if (!album.stream_conditions || !album.is_stream_gated) {
        program.error('Album is not stream gated')
      }
      if (!album.stream_conditions?.usdc_purchase?.splits) {
        program.error('Album is not purchaseable')
      }
      blocknumber = album.blocknumber
      streamConditions = album.stream_conditions
    } else {
      program.error('Invalid type')
    }

    let extraAmount
    if (extraAmountCents) {
      const parsedExtraAmount = Number.parseInt(extraAmountCents)
      if (!Number.isFinite(parsedExtraAmount) || parsedExtraAmount <= 0) {
        program.error(`Invalid extra amount: ${extraAmountCents}`)
      }
      extraAmount = parsedExtraAmount * 10 ** 4
    }

    try {
      const response = await audiusLibs.solanaWeb3Manager.purchaseContent({
        id: contentId,
        extraAmount,
        type,
        blocknumber,
        splits: streamConditions.usdc_purchase.splits,
        purchaserUserId: user.user_id,
        purchaseAccess: 'stream'
      })
      if (response.error) {
        program.error(chalk.red(response.error))
      }
      console.log(chalk.green(`Successfully purchased ${type}`))
      console.log(chalk.yellow('Transaction Signature:'), response.res)
    } catch (err) {
      program.error(err.message)
    }

    process.exit(0)
  })
