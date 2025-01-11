import { program } from 'commander'

import { sdk as audiusSdk, EntityType, HashId } from '@audius/sdk'

import { Action } from '../services/EntityManager/types'

program
  .command('verify')
  .description('Verify a user')
  .option('-h, --handle <handle>', 'The handle to verify')
  .option('-s, --socialHandle <social-handle>', 'The social handle to verify')
  .option('--privateKey <privateKey>', 'The private key to use for the request')
  .option(
    '-p, --platform <platform>',
    'The platform to verify (twitter, instagram, tiktok)'
  )
  .action(async (args) => {
    if (
      !args.handle ||
      !args.socialHandle ||
      !args.platform ||
      !args.privateKey
    ) {
      console.error(
        'Missing required arguments: handle, socialHandle, and platform are required'
      )
      process.exit(1)
    }
    if (!['twitter', 'instagram', 'tiktok'].includes(args.platform)) {
      console.error('Invalid platform:', args.platform)
      process.exit(1)
    }

    const sdk = audiusSdk({
      appName: 'verify-user',
      apiSecret: args.privateKey
    })

    try {
      const user = await sdk.users.getUserByHandle({ handle: args.handle })
      const userId = HashId.parse(user.data?.id)
      console.log('Verifying user', userId)

      const config: {
        is_verified: boolean
        twitter_handle?: string
        instagram_handle?: string
        tiktok_handle?: string
      } = {
        is_verified: true
      }
      if (args.platform === 'twitter') {
        config.twitter_handle = args.socialHandle
      } else if (args.platform === 'instagram') {
        config.instagram_handle = args.socialHandle
      } else if (args.platform === 'tiktok') {
        config.tiktok_handle = args.socialHandle
      }

      console.log('With config', config)
      console.log('Sending tx...')
      const { blockHash, blockNumber } =
        await sdk.services.entityManager.manageEntity({
          userId,
          entityType: EntityType.USER,
          entityId: userId,
          action: Action.VERIFY,
          metadata: JSON.stringify({
            cid: '',
            data: config
          })
        })
      console.log('Block hash', blockHash)
      console.log('Block number', blockNumber)
      process.exit(0)
    } catch (error) {
      console.error('Verification failed:', error)
      process.exit(1)
    }
  })

program.parseAsync()
