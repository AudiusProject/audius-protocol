/**
 * Find the creator nodes associated with a user and their respective clock values.
 *
 * Script usage: node userClockValues.js <size> <outFile>
 */
const axios = require('axios')
const CreatorNode = require('@audius/libs/src/services/creatorNode')
const { Command } = require('commander')

function commaSeparatedList(value, unusedPrevValue) {
  return value.split(',')
}

const program = new Command()
program
  .usage('')
  .option('-h, --handles <handles>', 'Audius handles', commaSeparatedList, [])
  .option('-i, --user-ids <userIds>', 'Audius user ids', commaSeparatedList, [])

const discoveryProviderEndpoint = process.env.DISCOVERY_PROVIDER_ENDPOINT

async function getUserByHandle(handle, discoveryProviderEndpoint) {
  try {
    return (
      await axios({
        url: `/v1/full/users/handle/${handle}`,
        method: 'get',
        baseURL: discoveryProviderEndpoint
      })
    ).data.data[0]
  } catch (err) {
    throw new Error(
      `Failed to get creator node endpoint and wallet from endpoint: ${discoveryProviderEndpoint} and handle: ${handle} with ${err}`
    )
  }
}

async function getUserById(userId, discoveryProviderEndpoint) {
  try {
    const resp = (
      await axios({
        url: `/users?id=${userId}`,
        method: 'get',
        baseURL: discoveryProviderEndpoint
      })
    ).data.data[0]

    if (!resp) {
      throw new Error(`Failed to find user with userId ${userId}`)
    }

    return resp
  } catch (err) {
    throw new Error(
      `Failed to get creator node endpoint and wallet from endpoint: ${discoveryProviderEndpoint} and user id: ${userId} with ${err}`
    )
  }
}
async function getClockValues({
  wallet,
  creator_node_endpoint: creatorNodeEndpoint,
  user_id: userId
}) {
  const primaryCreatorNode = CreatorNode.getPrimary(creatorNodeEndpoint)
  const secondaryCreatorNodes = CreatorNode.getSecondaries(creatorNodeEndpoint)

  if (!creatorNodeEndpoint) {
    return {
      primaryNode: '',
      primaryClockValue: '',
      secondaryNodes: [],
      secondaryClockValues: [],
      userId: userId
    }
  }

  return {
    primaryNode: primaryCreatorNode,
    primaryClockValue: await CreatorNode.getClockValue(
      primaryCreatorNode,
      wallet
    ),
    secondaryNodes: secondaryCreatorNodes,
    secondaryClockValues: await Promise.all(
      secondaryCreatorNodes.map(secondaryNode =>
        CreatorNode.getClockValue(secondaryNode, wallet)
      )
    ),
    userId: userId
  }
}
// get clock values for all users / some users via userIds / handles
async function getUserClockValues(handles, userIds) {
  const usersFromHandles = handles.map(handle =>
    getUserByHandle(handle, discoveryProviderEndpoint)
  )

  const usersFromIds = userIds.map(userId =>
    getUserById(userId, discoveryProviderEndpoint)
  )

  return (await Promise.all([...usersFromHandles, ...usersFromIds])).map(
    async user => await getClockValues(user)
  )
}

async function run() {
  const { handles, userIds } = parseArgsAndEnv()
  const userClockValues = await Promise.all(
    await getUserClockValues(handles, userIds)
  )
  userClockValues.forEach(
    ({
      primaryNode,
      primaryClockValue,
      secondaryNodes,
      secondaryClockValues,
      userId
    }) => {
      console.log('UserId:', userId)
      console.log('Primary')
      console.log(primaryNode, primaryClockValue)

      console.log('Secondary')
      secondaryNodes.forEach((secondaryNode, idx) => {
        console.log(secondaryNode, secondaryClockValues[idx])
      })

      console.log()
    }
  )
}

/**
 * Process command line args, expects user handle as command line input.
 */
function parseArgsAndEnv() {
  program.parse(process.argv)
  if (!discoveryProviderEndpoint) {
    const errorMessage =
      'Incorrect script usage, expected DISCOVERY_PROVIDER_ENDPOINT in env.\ntry `export DISCOVERY_PROVIDER_ENDPOINT="https://discoveryprovider.audius.co"`'
    throw new Error(errorMessage)
  }

  return {
    handles: program.handles,
    userIds: program.userIds
  }
}

run()
