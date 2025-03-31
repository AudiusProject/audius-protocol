import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'
import type { ChallengeId, GenerateSpecifierRequest } from '@audius/sdk'

export const claimRewardCommand = new Command('claim-reward')
  .description('Claim a challenge reward')
  .argument('<challengeId>', 'The ID of the challenge to claim')
  .argument('<amount>', 'The amount to claim', parseFloat)
  .option('-f, --from <from>', 'The account to claim from')
  .option(
    '-c, --contentId <contentId>',
    'The track or album purchased (for Audio Match challenges)'
  )
  .option(
    '-r, --referredUserId <referredUserId>',
    'The user referred (for referral challenges)'
  )
  .action(async (challengeId, amount, { from, contentId, referredUserId }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    const specifier = await audiusSdk.challenges.generateSpecifier({
      challengeId: challengeId as ChallengeId,
      userId,
      contentId,
      referredUserId
    } as GenerateSpecifierRequest)
    const res = await audiusSdk.challenges.claimReward({
      userId,
      challengeId: challengeId as ChallengeId,
      specifier,
      amount
    })
    console.log(chalk.green('Successfully claimed reward'))
    console.log(chalk.yellow.bold('Transaction Signature:'), res)
  })

export const rewardSpecifierCommand = new Command('reward-specifier')
  .description('Get the specifier for a challenge')
  .argument('<challengeId>', 'The ID of the challenge')
  .option('-f, --from <from>', 'The account to call from')
  .option('-c, --contentId <contentId>', 'The track or album purchased')
  .option('-r, --referredUserId <referredUserId>', 'The user referred')
  .action(async (challengeId, { from, contentId, referredUserId }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })
    const userId = await getCurrentUserId()

    const specifier = await audiusSdk.challenges.generateSpecifier({
      challengeId,
      userId,
      contentId,
      referredUserId
    } as GenerateSpecifierRequest)
    console.log(chalk.yellow.bold('Specifier:'), specifier)
  })
