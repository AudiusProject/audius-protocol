import { program } from 'commander'

import { sdk as audiusSdk } from '../sdk'

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

    const user = await sdk.users.getUserByHandle(args.handle)
    // const [encodedABI, contractAddress] = await audiusLibs.User.updateSocialVerification(
    //     userId, verifierPrivKey, config
    // )
    // console.log({contractAddress})
    // console.log({encodedABI})
    // await audiusLibs.discoveryProvider.relay({
    //     contractRegistryKey: 'EntityManager',
    //     contractAddress,
    //     senderAddress: verifierPubKey,
    //     encodedABI,
    //     nethermindContractAddress: contractAddress,
    //     nethermindEncodedAbi: encodedABI
    // })

    console.log(user)
    try {
      // const result = await sdk.users.verifyUser(
      //   args.handle,
      //   args.socialHandle,
      //   args.platform
      // )
      // console.log('User verification successful:', result)
    } catch (error) {
      console.error('Verification failed:', error)
      process.exit(1)
    }
  })

program.parseAsync()
