import { program } from 'commander'

import {
  AntiAbuseOracleSelector,
  ChallengeId,
  Configuration,
  DiscoveryNodeSelector,
  SolanaRelay,
  sdk
} from '../src'

const audiusSdk = () => {
  return sdk({
    appName: 'claim-rewards',
    environment: 'production',
    services: {
      discoveryNodeSelector: new DiscoveryNodeSelector({
        allowlist: new Set([
          'https://discoveryprovider.audius.co',
          'https://dn1.monophonic.digital',
          'https://audius-dn1.tikilabs.com'
        ])
      }),
      antiAbuseOracleSelector: new AntiAbuseOracleSelector({
        endpoints: ['https://discoveryprovider.audius.co'],
        registeredAddresses: ['0x9811BA3eAB1F2Cd9A2dFeDB19e8c2a69729DC8b6']
      }),
      solanaRelay: new SolanaRelay(
        new Configuration({
          basePath: '/solana',
          headers: {
            'Content-Type': 'application/json'
          },
          middleware: [
            {
              pre: async (context) => {
                const endpoint = 'https://discoveryprovider.audius.co'
                const url = `${endpoint}${context.url}`
                return { url, init: context.init }
              }
            }
          ]
        })
      )
    }
  })
}

program
  .command('claim-rewards')
  .description('Claim rewards for a user')
  .option('-u, --handle <handle>', 'The handle to claim rewards for')
  .action(async (args) => {
    const sdk = audiusSdk()

    const { data: user } = await sdk.users.getUserByHandle({
      handle: args.handle
    })
    if (!user) {
      throw new Error('User not found')
    }
    const { id } = user

    while (true) {
      const { data: challenges } =
        await sdk.challenges.getUndisbursedChallenges({
          userId: id.toString(),
          limit: 10
        })

      if (!challenges || challenges.length === 0) {
        console.info('No more undisbursed challenges found. Exiting.')
        break
      }

      console.info(
        `Found ${challenges.length} undisbursed challenges. Processing...`
      )
      for (const challenge of challenges) {
        console.info('Claiming challenge', challenge.specifier, challenge)
        try {
          const result = await sdk.challenges.claimReward({
            challengeId: challenge.challengeId as ChallengeId,
            userId: challenge.userId,
            specifier: challenge.specifier,
            amount: parseFloat(challenge.amount)
          })
          console.info('Claimed challenge', challenge.specifier, result)
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (e) {
          console.error('Error claiming challenge', challenge.specifier, e)
        }
      }
    }
  })

program.parseAsync()
