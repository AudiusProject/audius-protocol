const Web3 = require('web3')
const web3 = new Web3('http://localhost:8545')
const assert = require('assert').strict
const axios = require('axios')

const OWNER_WALLET = '0x1D9c77BcfBfa66D37390BF2335f0140979a6122B'
const PRIVATE_KEY = '0x3873ed01bfb13621f9301487cc61326580614a5b99f3c33cf39c6f9da3a19cad'

async function generateSignatureResponse (data) {
  const timestamp = Date.now() // TODO: put in Z format

  // follows the strucutre {timestamp, /* data of any structure */}
  const toSign = { timestamp, ...data }
  const signedResponse = await web3.eth.accounts.sign(JSON.stringify(toSign), PRIVATE_KEY)

  const response = {
    signature: signedResponse.signature,
    timestamp,
    ...data
  }

  return response
}

async function run () {
  const { data } = await axios.get('http://localhost:5000/get_sig')
  const recoveredWallet = await recoverWallet(data)

  try {
    assert.equal(recoveredWallet, OWNER_WALLET)
  } catch (e) {
    console.log(e)
  }
}

async function recoverWallet (response) {
  let data = { data: response.data, timestamp: response.timestamp }
  data = JSON.stringify(sortKeys(data))

  const hashedData = web3.utils.keccak256(data)
  const ownerWallet = web3.eth.accounts.recover(hashedData, response.signature)

  return ownerWallet
}

function sortKeys (x) {
  if (typeof x !== 'object' || !x) { return x }
  if (Array.isArray(x)) { return x.map(sortKeys) }
  return Object.keys(x).sort().reduce((o, k) => ({ ...o, [k]: sortKeys(x[k]) }), {})
}

run()
