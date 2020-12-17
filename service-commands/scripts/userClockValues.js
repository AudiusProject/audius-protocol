/**
 * Find the creator nodes associated with a user and their respective clock values.
 *
 * Script usage: node userClockValues.js <size> <outFile>
 */
const axios = require('axios')
const CreatorNode = require('@audius/libs/src/services/creatorNode')
const { Command } = require('commander')

const program = new Command()
program
  .usage('')
  .option('-h, --handle <handle>', 'Audius handle')
  .option('-i, --user-id <userId>', 'Audius user id')

const discoveryProvider = 'https://discoveryprovider.audius.co'

async function run() {
  try {
    const { handle, userId } = parseArgs()
    const { wallet, creator_node_endpoint: creatorNodeEndpoint } = (
      await axios({
        url: handle ? `/v1/full/users/handle/${handle}` : `/users?id=${userId}`,
        method: 'get',
        baseURL: discoveryProvider
      })
    ).data.data[0]

    primaryCreatorNode = CreatorNode.getPrimary(creatorNodeEndpoint)
    secondaryCreatorNodes = CreatorNode.getSecondaries(creatorNodeEndpoint)

    console.log('Primary')
    console.log(
      primaryCreatorNode,
      await CreatorNode.getClockValue(primaryCreatorNode, wallet)
    )

    console.log('\nSecondaries')
    secondaryCreatorNodes.forEach(async secondaryCreatorNode => {
      console.log(
        secondaryCreatorNode,
        await CreatorNode.getClockValue(secondaryCreatorNode, wallet)
      )
    })
  } catch (err) {
    if (err instanceof axios.AxiosError) {
      if (error.request.baseURL === discoveryProvider) {
        console.error(
          `Could not get wallet and endpoint from discovery node ${discoveryProvider}: ${err}`
        )
      } else {
        console.error(
          `Could not fetch clock values at endpoint ${creatorNode}: ${err}`
        )
      }
    } else {
      console.error(err)
    }
  }
}

/**
 * Process command line args, expects user handle as command line input.
 */
function parseArgs() {
  program.parse(process.argv)

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
  }
}

run()
