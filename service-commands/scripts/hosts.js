/**
 * This script adds mappings from container-local servicenames to localhost to the hosts file in `/etc/hosts`.
 * This allows us to use the same addressing scheme that we use to talk between containers to talk from the
 * host system to a container. This greatly simplifies running a local protocol stack.
 *
 * Usage: sudo node hosts.js add/remove
 */
const fs = require('fs')
const { exit } = require('process')

const config = require('../config/config')

const ERR_MSG =
  'Usage: Pass in either \'add\' or \'remove\' to add or remove mappings from host file.'
const START_SENTINEL = '# START-AUDIUS-LOCAL-DEV'
const END_SENTINEL = '# END-AUDIUS-LOCAL-DEV'

const REMOTE_DEV_HOST = config.get('remote_dev_host') // ip address

// TODO: unhardcode these
const SERVICES = [
  'cn1_creator-node_1',
  'cn2_creator-node_1',
  'cn3_creator-node_1',
  'cn4_creator-node_1',
  'cn5_creator-node_1',
  'cn6_creator-node_1',
  'cn7_creator-node_1',
  'cn8_creator-node_1',
  'cn9_creator-node_1',
  'cn10_creator-node_1',
  'dn1_web-server_1',
  'dn2_web-server_1',
  'dn3_web-server_1',
  'dn4_web-server_1',
  'dn5_web-server_1',
  'dn6_web-server_1',
  'dn7_web-server_1',
  'dn8_web-server_1',
  'dn9_web-server_1',
  'dn10_web-server_1',
  'cn-um_creator-node_1',
  'audius_ganache_cli',
  'audius_client',
  'audius-identity-service_identity-service_1',
  'audius-disc-prov_web-server_1'
]

const exitWithError = () => {
  console.error(ERR_MSG)
  exit(1)
}

const verifyNotAlreadyAdded = lines =>
  !lines.some(l => l.search(START_SENTINEL) !== -1)

const readFileIntoArray = () => {
  const hosts = fs.readFileSync('/etc/hosts', 'utf8')
  return hosts.split('\n')
}

const writeArrayIntoFile = arr => {
  const joined = arr.join('\n')
  fs.writeFileSync('/etc/hosts', joined)
}

const args = process.argv
if (args.length !== 3) {
  exitWithError()
}
const cmd = process.argv[2]
if (cmd === 'add') {
  let lines = readFileIntoArray()
  if (!verifyNotAlreadyAdded(lines)) {
    console.log('Local dev mapping already exists! If you want to update your hosts file, please run the `remove` command and then re-run `add`.')
    exit(0)
  }

  const hostMappings = SERVICES.map(s => `127.0.0.1 ${s}`)
  lines = [...lines, START_SENTINEL, ...hostMappings, END_SENTINEL, '\n']
  writeArrayIntoFile(lines)
} else if (cmd === 'remove') {
  const lines = readFileIntoArray()
  const [startIndex, endIndex] = [
    lines.findIndex(l => l.search(START_SENTINEL) !== -1),
    lines.findIndex(l => l.search(END_SENTINEL) !== -1)
  ]
  if (startIndex === -1 || endIndex === -1) {
    console.error('No existing entry found.')
    exit(0)
  }
  lines.splice(startIndex, endIndex - startIndex + 1)
  writeArrayIntoFile(lines)
} else if (cmd === 'add-remote-host') {
  let lines = readFileIntoArray()
  if (!verifyNotAlreadyAdded(lines)) {
    console.log('Local dev mapping already exists! If you want to update your hosts file, please run the `remove` command and then re-run `add-remote-host`.')
    exit(0)
  }

  if (!REMOTE_DEV_HOST || REMOTE_DEV_HOST === '127.0.0.1') {
    throw new Error('Misconfigured local env.\nEnsure AUDIUS_REMOTE_DEV_HOST has been exported and /etc/hosts file has necessary permissions.')
  }
  const hostMappings = SERVICES.map(s => `${REMOTE_DEV_HOST} ${s}`)
  lines = [...lines, START_SENTINEL, ...hostMappings, END_SENTINEL, '\n']
  writeArrayIntoFile(lines)
} else {
  exitWithError()
}
