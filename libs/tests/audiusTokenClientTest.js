const assert = require('assert')
const helpers = require('./helpers')

const libs = helpers.audiusInstance

const INITIAL_SUPPLY = Math.pow(10,27) // 10^27 = 1 billion tokens, 18 decimal places

let token
let ownerWallet
let accounts

before(async function () {
  await libs.init()
  token = libs.ethContracts.AudiusTokenClient
  ownerWallet = libs.ethWeb3Manager.getWalletAddress()
  accounts = await libs.ethWeb3Manager.getWeb3().eth.getAccounts()
})

it('Confirm token creator initial balance', async function () {
  assert.equal(await token.balanceOf(ownerWallet), INITIAL_SUPPLY)
  assert.equal(await token.balanceOf(accounts[1]), 0)
})

it('Should test transfer', async function () {
  await token.transfer(accounts[1], 1000)
  assert.equal(await token.balanceOf(ownerWallet), INITIAL_SUPPLY - 1000)
  assert.equal(await token.balanceOf(accounts[1]), 1000)
})
