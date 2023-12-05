import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusLibs } from './utils.mjs'

program
  .command('purchase-track')
  .description('Purchases a track using USDC')
  .argument('<trackId>', 'The track to purchase')
  .option('-f, --from [from]', 'The account purchasing the track (handle)')
  .option(
    '-e, --extra-amount [amount]',
    'Extra amount to pay in addition to the track price (in cents)'
  )
  .action(async (trackId, { from, extraAmount: extraAmountCents }) => {
    const audiusLibs = await initializeAudiusLibs(from)
    const user = audiusLibs.userStateManager.getCurrentUser();

    const track = (await audiusLibs.Track.getTracks(100, 0, [trackId]))[0]
    if (!track.premium_conditions || !track.is_premium) {
      program.error('Track is not premium')
    }
    if (!track.premium_conditions?.usdc_purchase?.splits) {
      program.error('Track is not purchaseable')
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
        id: trackId,
        extraAmount,
        type: 'track',
        blocknumber: track.blocknumber,
        splits: track.premium_conditions.usdc_purchase.splits,
        purchaserUserId: user.user_id
      })
      if (response.error) {
        program.error(chalk.red(response.error))
      }
      console.log(chalk.green('Successfully purchased track'))
      console.log(chalk.yellow('Transaction Signature:'), response.res)
    } catch (err) {
      program.error(err.message)
    }

    process.exit(0)
  })
