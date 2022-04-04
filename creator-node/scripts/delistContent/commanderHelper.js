const { Command } = require('commander')

const ACTION_ARR = ['ADD', 'REMOVE']
const ACTION_SET = new Set(ACTION_ARR)
const TYPES_ARR = ['USER', 'TRACK', 'CID', 'TRACK_HASH_ID']
const TYPES_SET = new Set(TYPES_ARR)

const COMMANDER_HELP_STRING =
`-a [action] -t [type] -l [ids or cids] -v [verbose (optional)]

// Example usage:
// node delistContent/index.js -a add -l 1,3,7 -t user
// node delistContent/index.js -a add -l 1,3,7 -t track
// node delistContent/index.js -a add -l 7eP5n,ML51L -t track-hash-id
// node delistContent/index.js -a add -l Qm..., Qm..., -t cid

// node delistContent/index.js -a remove -l 1,3,7 -t user
// node delistContent/index.js -a remove -l 1,3,7 -t track
// node delistContent/index.js -a remove -l 7eP5n,ML51L -t track-hash-id
// node delistContent/index.js -a remove -l Qm..., Qm..., -t cid
`

module.exports = {
  COMMANDER_HELP_STRING
}

class Commander {
  constructor () {
    this.program = new Command()
    this.program
      .usage(COMMANDER_HELP_STRING)
      .requiredOption('-t, --type <type>', `Type of id - either 'track', 'track-hash-id', 'user' or 'cid'.\n'track-hash-id' is an encoded version of a track id commonly found in URLs with this pattern 'https://contentnode.domain.com/tracks/stream/7eP5n'. In this case the 'track-hash-id' is '7eP5n'.`)
      .requiredOption('-l, --list <list>', 'comma separated list of ids or cids', ids => ids.split(','))
      .requiredOption('-a, --act <action>', '`add` to set of delisted content or `remove` from set of delisted content')
      .option('-v, --verbose', 'verbose mode to print out debug logs', false)
      .exitOverride(err => {
        if (err.code === 'commander.missingMandatoryOptionValue') this.program.help()
      })
  }

  /**
 * Parses the environment variables and command line args
 */
  parseEnvVarsAndArgs ({ CREATOR_NODE_ENDPOINT, PRIVATE_KEY, DISCOVERY_PROVIDER_ENDPOINT, hashIds }) {
    this.program.parse(process.argv)

    // Parse env vars
    if (!CREATOR_NODE_ENDPOINT || !PRIVATE_KEY || !DISCOVERY_PROVIDER_ENDPOINT) {
      let errorMsg = `Creator node endpoint [${CREATOR_NODE_ENDPOINT}], private key [${PRIVATE_KEY}]`
      errorMsg += ` or discovery provider endpoint [${DISCOVERY_PROVIDER_ENDPOINT}] have not been exported.`
      throw new Error(errorMsg)
    }

    // Parse CLI args
    const action = this.program.act.toUpperCase()
    // this is a let because TRACK_HASH_ID switches to type TRACK once the ids have been decoded
    let type = this.program.type.toUpperCase().replace(/-/g, '_')

    if (!ACTION_SET.has(action) || !TYPES_SET.has(type)) {
      throw new Error(`Improper action (${action}) for type (${type}).`)
    }

    // Check if ids or CIDs are passed in
    let values = this.program.list
    if (!values || values.length === 0) throw new Error('Please pass in a comma separated list of ids and/or cids.')

    // Parse ids into ints greater than 0
    if (type === 'USER' || type === 'TRACK') {
      const originalNumIds = values.length
      values = values.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
      if (values.length === 0) throw new Error('List of ids is not proper.')
      if (originalNumIds !== values.length) {
        console.warn(`Filtered out non-numeric ids from input. Please only pass integers!`)
      }
    } else if (type === 'TRACK_HASH_ID') {
      const originalNumIds = values.length
      values = values.map(value => {
        const decodedId = hashIds.decode(value)
        if (decodedId) return decodedId
      }).filter(Boolean)
      type = 'TRACK'
      if (values.length === 0) throw new Error('List of track hash ids is not proper.')
      if (originalNumIds !== values.length) {
        console.warn(`Filtered out invalid ids from input. Please only valid track hash ids!`)
      }
    } else { // else will be CID
      // Parse cids and ensure they follow the pattern Qm...
      const orignalNumCIDs = values.length
      const cidRegex = new RegExp('^Qm[a-zA-Z0-9]{44}$')
      values = values.filter(cid => cidRegex.test(cid))
      if (values.length === 0) throw new Error('List of cids is not proper.')
      if (orignalNumCIDs !== values.length) {
        console.warn(`Filtered out improper cids from input. Please only pass valid CIDs!`)
      }
    }

    return { action, values, type, verbose: this.program.verbose }
  }

  runParser ({ CREATOR_NODE_ENDPOINT, PRIVATE_KEY, DISCOVERY_PROVIDER_ENDPOINT, hashIds }) {
    try {
      return this.parseEnvVarsAndArgs({ CREATOR_NODE_ENDPOINT, PRIVATE_KEY, DISCOVERY_PROVIDER_ENDPOINT, hashIds })
    } catch (e) {
      throw new Error(`
        Incorrect script usage: ${e.message}
        - action: [${ACTION_ARR.toString()}]
        - type: [${TYPES_ARR.toString()}]
        - ids: [list of ids (or cids for CID type)]
      `)
    }
  }
}

module.exports = Commander
