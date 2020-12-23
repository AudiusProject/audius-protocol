/**
 * Find the creator nodes associated with a user and their respective clock values.
 *
 * Script usage:
 * export DISCOVERY_PROVIDER_ENDPOINT=<discovery provider endpoint>
 * node userClockValues.js -h <comma separated user handles> -i <comma separated user ids> -t <axios timeout>
 *
 * Example command: node userClockValues.js -h cheran_test,mukundan314 -i 3 -t 1000
 *
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
  .option(
    '-t, --timeout <timeout>',
    'Timeout for single request in ms',
    commaSeparatedList,
    5000
  )

const discoveryProviderEndpoint = process.env.DISCOVERY_PROVIDER_ENDPOINT

async function getUserByHandle(handle, discoveryProviderEndpoint, timeout) {
  try {
    return (
      await axios({
        url: `/v1/full/users/handle/${handle}`,
        method: 'get',
        baseURL: discoveryProviderEndpoint,
        timeout: timeout
      })
    ).data.data[0]
  } catch (err) {
    console.log(
      `Failed to get creator node endpoint and wallet from endpoint: ${discoveryProviderEndpoint} and handle: ${handle} with ${err}`
    )
  }
}

async function getUserById(userId, discoveryProviderEndpoint, timeout) {
  try {
    const resp = (
      await axios({
        url: `/users?id=${userId}`,
        method: 'get',
        baseURL: discoveryProviderEndpoint,
        timeout
      })
    ).data.data[0]

    if (!resp) {
      console.log(`Failed to find user with userId ${userId}`)
    }

    return resp
  } catch (err) {
    console.log(
      `Failed to get creator node endpoint and wallet from endpoint: ${discoveryProviderEndpoint} and user id: ${userId} with ${err}`
    )
  }
}

async function getClockValues(
  { wallet, creator_node_endpoint: creatorNodeEndpoint, handle },
  timeout
) {
  const primaryCreatorNode = CreatorNode.getPrimary(creatorNodeEndpoint)
  const secondaryCreatorNodes = CreatorNode.getSecondaries(creatorNodeEndpoint)

  if (!creatorNodeEndpoint) {
    return {
      primaryNode: '',
      primaryClockValue: '',
      secondaryNodes: [],
      secondaryClockValues: [],
      handle
    }
  }

  return {
    primaryNode: primaryCreatorNode,
    primaryClockValue: await CreatorNode.getClockValue(
      primaryCreatorNode,
      wallet,
      timeout
    ),
    secondaryNodes: secondaryCreatorNodes,
    secondaryClockValues: await Promise.all(
      secondaryCreatorNodes.map(secondaryNode =>
        CreatorNode.getClockValue(secondaryNode, wallet, timeout)
      )
    ),
    handle
  }
}

// get clock values for all users / some users via userIds / handles
async function getUserClockValues(handles, userIds, timeout) {
  const usersFromHandles = handles.map(handle =>
    getUserByHandle(handle, discoveryProviderEndpoint, timeout)
  )

  const usersFromIds = userIds.map(userId =>
    getUserById(userId, discoveryProviderEndpoint, timeout)
  )

  const users = await Promise.all([...usersFromHandles, ...usersFromIds])
  return Promise.all(
    users.filter(user => user).map(user => getClockValues(user, timeout))
  )
}

async function run() {
  const { handles, userIds, timeout } = parseArgsAndEnv()
  const userClockValues = await getUserClockValues(handles, userIds, timeout)
  userClockValues.forEach(
    ({
      primaryNode,
      primaryClockValue,
      secondaryNodes,
      secondaryClockValues,
      handle
    }) => {
      console.log('Handle:', handle)
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

<<<<<<< HEAD
  // check appropriate CLI usage
  if (program.handle && program.userId) {
    const errorMessage =
      'Incorrect script usage, expected handle or user id, got both.\nPlease follow the structure: node userClockValues.js -h <handle> or node userClockValues.js -i <userId>'
    throw new Error(errorMessage)
  }
  if (!program.handle && !program.userId) {
    const errorMessage =
      'Incorrect script usage, expected handle or user id, got neither.\nPlease follow the structure: node userClockValues.js -h <handle> or node userClockValues.js -i <userId>'
    throw new Error(errorMessage)
  }

  return {
    handle: program.handle,
    userId: program.userId
=======
  return {
    handles: program.handles,
    userIds: program.userIds,
    timeout: Number(program.timeout)
>>>>>>> origin
  }
}

run()
