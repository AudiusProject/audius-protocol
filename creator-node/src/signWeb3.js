const Web3 = require('web3')
const web3 = new Web3('http://localhost:8545')
const assert = require('assert').strict
const axios = require('axios')

const OWNER_WALLET = '0x1D9c77BcfBfa66D37390BF2335f0140979a6122B'
const PRIVATE_KEY = '0x3873ed01bfb13621f9301487cc61326580614a5b99f3c33cf39c6f9da3a19cad'
const METADATA_FIELDS = ['success', 'latest_indexed_block', 'latest_chain_block']
const API_SIGNING_FIELDS = ['timestamp', 'signature']

async function generateSignatureResponse (data) {
  const timestamp = Date.now() // TODO: put in Z format

  // follows the strucutre {timestamp, /* data of any structure */}
  let toSign = { timestamp, ...data }
  toSign = sortKeys(toSign)

  const signedResponse = await web3.eth.accounts.sign(JSON.stringify(toSign), PRIVATE_KEY)

  const response = {
    signature: signedResponse.signature,
    timestamp,
    ...data
  }

  return response
}

async function run () {
  const paths = ['users', 'version', 'tracks', 'health_check', 'block_check']

  // for each path, do an axios request
  for (const path of paths) {
    console.log(`request to ${path}`)
    const endpoint = 'http://localhost:5000/' + path

    // recover each response and check wallets are good
    const { data } = await axios.get(endpoint)
    console.time(`recover wallet ${path}`)
    const recoveredWallet = await recoverWallet(data)
    console.timeEnd(`recover wallet ${path}`)
    console.log('')

    try {
      assert.equal(recoveredWallet, OWNER_WALLET)
    } catch (e) {
      console.log(`failed for path ${path}: ${e}`)
      console.log('-------------------------------------------')
    }
  }
}

async function recoverWallet (response) {
  const filteredResponse = await removeNondataFields(response)
  let data = { ...filteredResponse, timestamp: response.timestamp }
  data = JSON.stringify(sortKeys(data))

  const hashedData = await web3.utils.keccak256(data)
  const ownerWallet = await web3.eth.accounts.recover(hashedData, response.signature)

  return ownerWallet
}

async function removeNondataFields (response) {
  const copy = JSON.parse(JSON.stringify(response))
  METADATA_FIELDS.forEach(field => {
    delete copy[field]
  })
  API_SIGNING_FIELDS.forEach(field => {
    delete copy[field]
  })

  return copy
}

function sortKeys (x) {
  if (typeof x !== 'object' || !x) { return x }
  if (Array.isArray(x)) { return x.map(sortKeys) }
  return Object.keys(x).sort().reduce((o, k) => ({ ...o, [k]: sortKeys(x[k]) }), {})
}

run()
