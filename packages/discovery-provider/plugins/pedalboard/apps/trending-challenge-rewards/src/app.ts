import { App } from '@pedalboard/basekit'
import { Knex } from 'knex'
import { Ok, Err, Result } from 'ts-results'
import { AudiusLibs } from '@audius/sdk'
import { SharedData } from './config'
import {
  getChallengesDisbursementsUserbanksFriendlyEnsureSlots,
  getTrendingChallenges
} from './queries'
import fetch from 'node-fetch'
import axios from 'axios'
import { WebClient } from '@slack/web-api'
import { formatDisbursementTable } from './slack'

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
  dryRun: boolean
): Promise<Result<undefined, string>> => {
  const db = app.getDnDb()
  const libs = app.viewAppData().libs
  const token = process.env.SLACK_BOT_TOKEN
  if (token === undefined) return new Err('SLACK_BOT_TOKEN undefined')
  const client = new WebClient(token)

  console.log(`doing ${dryRun ? 'a dry run' : 'the real deal'}`)

  const completedBlockRes = await findStartingBlock(db)
  if (completedBlockRes.err) return completedBlockRes
  const [completedBlock, specifier] = completedBlockRes.unwrap()

  const trimmedSpecifier = specifier.split(':')[0]

  const nodeGroups = await assembleNodeGroups(libs)

  await getAllChallenges(app, nodeGroups, completedBlock, dryRun)

  const friendly = await getChallengesDisbursementsUserbanksFriendlyEnsureSlots(
    db,
    trimmedSpecifier
  )

  const formattedResults = formatDisbursementTable(friendly)
  console.log(formattedResults)

  const channel = process.env.SLACK_CHANNEL
  if (channel === undefined) return new Err('SLACK_CHANNEL not defined')
  await client.chat.postMessage({
    channel,
    text: '```' + formattedResults + '```'
  })

  return new Ok(undefined)
}

export const findStartingBlock = async (
  db: Knex
): Promise<Result<[number, string], string>> => {
  const challenges = await getTrendingChallenges(db)
  console.log('challenges = ', JSON.stringify(challenges))
  const firstChallenge = challenges[0]
  if (firstChallenge === undefined)
    return new Err(`no challenges found ${challenges}`)
  const completedBlocknumber = firstChallenge.completed_blocknumber
  if (completedBlocknumber === null)
    return new Err(`completed block number is null ${firstChallenge}`)
  const specifier = firstChallenge.specifier
  // why we subtract one
  // https://www.notion.so/audiusproject/Manually-Complete-Rewards-Challenge-Manually-disburse-trending-24daed058dc54e4a8adb4912814481f2?pvs=4#1ced75c9c41740ce8facd19bf0d46720
  return new Ok([completedBlocknumber - 1, specifier])
}

// copied from libs because it's not exported
type Node = {
  endpoint: string
  spID?: string
  owner: string
  delegateOwnerWallet: string
}

const assembleNodeGroups = async (
  libs: AudiusLibs
): Promise<Map<string, Node[]>> => {
  const nodes =
    await libs.ServiceProvider?.discoveryProvider.serviceSelector.getServices({
      verbose: true
    })
  if (nodes === undefined)
    throw new Error('no nodes returned from libs service provider')

  const groups = new Map<string, Node[]>()
  for (const node of nodes) {
    const ownerNodes = groups.get(node.owner)
    if (ownerNodes === undefined) {
      groups.set(node.owner, [
        {
          endpoint: node.endpoint,
          spID: node.spID,
          owner: node.owner,
          delegateOwnerWallet: node.delegateOwnerWallet
        }
      ])
    } else {
      ownerNodes.push({
        endpoint: node.endpoint,
        spID: node.spID,
        owner: node.owner,
        delegateOwnerWallet: node.delegateOwnerWallet
      })
      groups.set(node.owner, ownerNodes)
    }
  }

  return groups
}

const canSuccessfullyAttest = async (
  endpoint: string,
  specifier: string,
  userId: number,
  challengeId: string,
  oracleEthAddress: string
): Promise<boolean> => {
  const url = makeAttestationEndpoint(
    endpoint,
    specifier,
    userId,
    challengeId,
    oracleEthAddress
  )
  try {
      const res = await fetch(url)
      return res && res.ok
  } catch (e) {
    console.warn("cant attest", e, url)
    return false
  }
}

const makeAttestationEndpoint = (
  endpoint: string,
  specifier: string,
  userId: number,
  challengeId: string,
  oracleEthAddress: string
): string =>
  `${endpoint}/v1/challenges/${challengeId}/attest?oracle=${oracleEthAddress}&specifier=${encodeURIComponent(
    specifier
  )}&user_id=${userId}`

type Challenge = {
  challenge_id: string
  user_id: number
  specifier: string
  amount: string
  completed_blocknumber: number
  handle: string
  wallet: string
}

const getAllChallenges = async (
  app: App<SharedData>,
  groups: Map<string, Node[]>,
  startBlock: number,
  dryRun: boolean
) => {
  const {
    AAOEndpoint,
    oracleEthAddress,
    feePayerOverride,
    libs,
    localEndpoint
  } = app.viewAppData()
  if (libs === null) return undefined
  const res = await axios.get(
    `${localEndpoint}/v1/challenges/undisbursed?completed_blocknumber=${startBlock}`
  )

  const data: Challenge[] = res.data.data

  const toDisburse = data.filter((c) =>
    ['tt', 'tp', 'tut'].includes(c.challenge_id)
  )

  console.log(`Found ${toDisburse.length} trending challenges to disburse`)
  let possibleNodeSet: string[] = []
  let possibleChallenges = []
  let impossibleChallenges = []
  let setToChallengeMap = new Map<string, any[]>()

  for (const challenge of toDisburse) {
    console.log(`Trying challenge: ${JSON.stringify(challenge)}`)

    let isValidNodeSet = possibleNodeSet.length === 3
    // Ensure any pre-existing set is valid
    if (isValidNodeSet) {
      console.log('Validing existing node set...')
      for (const endpoint of possibleNodeSet) {
        const canAttest = await canSuccessfullyAttest(
          endpoint,
          challenge.specifier,
          challenge.user_id,
          challenge.challenge_id,
          oracleEthAddress
        )

        if (!canAttest) {
          isValidNodeSet = false
          console.info('Invalid node set')
          break
        }
      }
    }
    // select again if needed
    if (!isValidNodeSet) {
      possibleNodeSet = []
      console.log('Node set not valid. Selecting nodes...', possibleNodeSet)
      for (const nodeGroup of groups.values()) {
        if (possibleNodeSet.length === 3) {
          console.log(`Got 3 nodes!: ${JSON.stringify(possibleNodeSet)}`)
          break
        }

        for (const node of nodeGroup) {
          console.log('attesting node ', node)
          const canAttest = await canSuccessfullyAttest(
            node.endpoint,
            challenge.specifier,
            challenge.user_id,
            challenge.challenge_id,
            oracleEthAddress
          )
          if (canAttest) {
            console.log(`Found attestable node: ${node.endpoint}`)
            possibleNodeSet.push(node.endpoint)
          }
          // Can't add another from this node group, so break
          break
        }
      }
    } else {
      console.log('Valid node set found!')
    }
    // did we succeed?
    if (possibleNodeSet.length !== 3) {
      console.log(
        `Could not find a valid node set for challenge: ${JSON.stringify(
          challenge.specifier
        )}, skipping.`, possibleNodeSet
      )
      impossibleChallenges.push(challenge)
      // reset it for next time
      possibleNodeSet = []
      continue
    }

    possibleChallenges.push({ challenge })
    const key = possibleNodeSet.sort().join(',')
    setToChallengeMap.set(key, [
      ...(setToChallengeMap.get(key) ?? []),
      challenge
    ])

    console.log(`Attesting for challenge: ${JSON.stringify(challenge)}`)

    const encodedUserId = challenge.user_id.toString()
    const rewards = libs.Rewards
    if (rewards === null) throw new Error('rewards object null')

    const args = {
      challengeId: challenge.challenge_id,
      encodedUserId,
      handle: challenge.handle,
      recipientEthAddress: challenge.wallet,
      specifier: challenge.specifier,
      oracleEthAddress,
      amount: parseInt(challenge.amount),
      quorumSize: 3,
      AAOEndpoint,
      instructionsPerTransaction: 2,
      maxAggregationAttempts: 1,
      endpoints: possibleNodeSet,
      feePayerOverride,
      logger: console
    }

    console.log({ args })

    if (!dryRun) {
      console.log('submitting')
      const { error } = await rewards.submitAndEvaluate(args)

      if (error) {
        console.log(
          'Challenge was unattestable despite new nodes, aborting...' +
            JSON.stringify(challenge)
        )
      }
    } else {
      console.log('running dry run')
    }
  }
  console.log(JSON.stringify(setToChallengeMap, null, 2))
  console.log(
    `All done. Impossible challenges: ${
      impossibleChallenges.length
    }: ${JSON.stringify(impossibleChallenges)}, possible challenges: ${
      possibleChallenges.length
    } ${JSON.stringify(possibleChallenges)}`
  )
}
