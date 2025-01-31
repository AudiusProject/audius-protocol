import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'
import { outputFormatOption } from '../common-options.js'

export const purchaseAlbumCommand = new Command('purchase-album')
  .description('Buys an album using USDC')
  .argument('<albumId>', 'The album ID')
  .argument('<price>', 'The expected price of the album', parseFloat)
  .option('-f, --from <from>', 'The account purchasing the content (handle)')
  .option(
    '-e, --extra-amount <amount>',
    'Extra amount to pay in addition to the price (in dollars)',
    parseFloat
  )
  .addOption(outputFormatOption)
  .action(async (albumId, price, { from, extraAmount, output }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })
    const userId = await getCurrentUserId()

    const response = await audiusSdk.albums.purchaseAlbum({
      albumId,
      userId,
      price,
      extraAmount,
      includeNetworkCut: true
    })
    if (output === 'json') {
      console.log(JSON.stringify(response))
    } else {
      console.log(chalk.green('Successfully purchased album'))
      console.log(chalk.yellow.bold('Transaction Signature:'), response)
    }
  })
