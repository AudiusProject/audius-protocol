/**
 * Find the creator nodes associated with a user and their respective clock values.
 *
 * Script usage: node userClockValues.js <size> <outFile>
 */
const axios = require('axios')
const CreatorNode = require('@audius/libs/src/services/creatorNode')

const discoveryProvider = 'https://discoveryprovider.audius.co'

async function run() {
  try {
    const { handle } = parseArgs()

    const { wallet, creator_node_endpoint: creatorNodeEndpoint } = (
      await axios({
        url: `/v1/full/users/handle/${handle}`,
        method: 'get',
        baseURL: discoveryProvider
      })
    ).data.data[0]

    primaryCreatorNode = CreatorNode.getPrimary(creatorNodeEndpoint)
    secondaryCreatorNodes = CreatorNode.getSecondaries(creatorNodeEndpoint)
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
    console.error(err)
  }
}

/**
 * Process command line args, expects user handle as command line input.
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const handle = args[0]

  // check appropriate CLI usage
  if (!handle) {
    const errorMessage = `Incorrect script usage for input handle (${handle})\nPlease follow the structure 'node userClockValues.js <handle>'`
    throw new Error(errorMessage)
  }

  return { handle }
}

run()
