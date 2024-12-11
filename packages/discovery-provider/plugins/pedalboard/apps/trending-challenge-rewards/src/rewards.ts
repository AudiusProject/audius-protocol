import { App } from '@pedalboard/basekit'
import { Knex } from 'knex'
import { Ok, Err, Result } from 'ts-results'
import { SharedData } from './config'
import {
  getChallengesDisbursementsUserbanksFriendlyEnsureSlots,
  getTrendingChallenges,
  getTrendingChallengesByDate
} from './queries'
import { WebClient } from '@slack/web-api'
import { formatDisbursementTable } from './slack'
import { discoveryDb } from './utils'
import { ChallengeId } from '@audius/sdk'
import axios from 'axios'

type Challenge = {
  challenge_id: string
  user_id: string
  specifier: string
  amount: string
  completed_blocknumber: number
  handle: string
  wallet: string
}

const TRENDING_ID = 'tt'
const UNDERGROUND_TRENDING_ID = 'tut'
const PLAY_TRENDING_ID = 'tp'
const TRENDING_REWARD_IDS = [TRENDING_ID, PLAY_TRENDING_ID, UNDERGROUND_TRENDING_ID]


// TODO: move something like this into App so results are commonplace for handlers
export const disburseTrendingRewards = async (
  app: App<SharedData>
): Promise<void> => {
  const { dryRun } = app.viewAppData()
  const disburse = await onDisburse(app, dryRun)
  disburse.mapErr(console.error)
}

// dryRun separated out so it can be run manually via another trigger
export const onDisburse = async (
  app: App<SharedData>,
  dryRun: boolean,
  targetSpecifier?: string
): Promise<Result<undefined, string>> => {
  const db = discoveryDb
  const { slackBotToken, slackChannel } = app.viewAppData()
  if (slackBotToken === undefined) throw new Err('slackBotToken undefined')
  const client = new WebClient(slackBotToken)

  console.log(`doing ${dryRun ? 'a dry run' : 'a live run'}`)

  const sdk = app.viewAppData().sdk

  let completedBlock, specifier
  if (!targetSpecifier) {
    const completedBlockRes = await findStartingBlock(db)
    if (completedBlockRes.err) return completedBlockRes
    const [startingBlock, startBlockSpecifier] = completedBlockRes.unwrap()
    completedBlock = startingBlock
    specifier = startBlockSpecifier
  } else {
    const response = await getTrendingChallengesByDate(db, targetSpecifier)
    const challenge = response[0]
    completedBlock = challenge.completed_blocknumber! - 1
    specifier = challenge.specifier
  }
  
  // Fetch all undisbursed challenges
  const endpoint = await sdk.services.discoveryNodeSelector.getSelectedEndpoint()
  console.log('endpoint = ', endpoint)
  const res = await axios.get(
    `${endpoint}/v1/challenges/undisbursed?completed_blocknumber=${completedBlock}`
  )
  const data: Challenge[] = res.data.data
  const toDisburse = data.filter((c) =>
    TRENDING_REWARD_IDS.includes(c.challenge_id)
)

// Claim all undisbursed challenges
for (const challenge of toDisburse) {
  const challengeId = Object.values(ChallengeId).find(id => id === challenge.challenge_id)!
  console.log('Claimable challengeId = ', challenge)
  const totalRetries = 10
  let res
  let retries = totalRetries
  while (retries > 0) {
    try {
      if (!dryRun) {
        res = await sdk.challenges.claimReward({
          challengeId,
          userId: challenge.user_id,
          specifier: challenge.specifier,
          amount: parseFloat(challenge.amount),
        })
        console.log('res = ', res)
        break // Success - exit retry loop
      }
    } catch (e) {
      console.error(`Error claiming reward, challengeId = ${challengeId}, attempt ${totalRetries - retries + 1} of ${totalRetries}, error = `, e)
      retries -= 1
      if (retries === 0) {
        console.error(`Failed to claim reward after ${totalRetries} attempts for challengeId = ${challengeId}`)
      }
    }
  }
}
  
  // Look at database to see if all challenges have been disbursed
  const trimmedSpecifier = specifier.split(':')[0]
  console.log('trimmedSpecifier = ', trimmedSpecifier)
  const friendly = await getChallengesDisbursementsUserbanksFriendlyEnsureSlots(
    db,
    trimmedSpecifier
  )

  // Format the results for Slack
  const formattedResults = formatDisbursementTable(friendly)
  console.log(formattedResults)

  if (slackChannel === undefined) return new Err('SLACK_CHANNEL not defined')
  await client.chat.postMessage({
    channel: slackChannel,
    text: '```' + formattedResults + '```'
  })

  return new Ok(undefined)
}

export const findStartingBlock = async (
  db: Knex
): Promise<Result<[number, string], string>> => {
  const challenges = await getTrendingChallenges(db)
  const firstChallenge = challenges[0]
  if (firstChallenge === undefined)
    return new Err(`no challenges found ${challenges}`)
  const completedBlocknumber = firstChallenge.completed_blocknumber
  if (completedBlocknumber === null)
    return new Err(`completed block number is null ${firstChallenge}`)
  const specifier = firstChallenge.specifier
  // Start from one before the first challenge
  return new Ok([completedBlocknumber - 1, specifier])
}
