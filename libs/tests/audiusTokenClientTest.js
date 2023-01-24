const assert = require('assert')
const helpers = require('./helpers')

const libs = helpers.audiusInstance

let token
let ownerWallet
let accounts
let initialSupply
let toBN

before(async function () {
  await libs.init()
  token = libs.ethContracts.AudiusTokenClient
  ownerWallet = libs.ethWeb3Manager.getWalletAddress()
  accounts = await libs.ethWeb3Manager.getWeb3().eth.getAccounts()
  toBN = libs.ethWeb3Manager.getWeb3().utils.toBN
})

it('Should test transfer', async function () {
  const initialOwnerBalance = await token.balanceOf(ownerWallet)
  const initialAccount1Balance = await token.balanceOf(accounts[1])
  const amount = toBN('1000')
  await token.transfer(accounts[1], amount)

  const finalOwnerBalance = await token.balanceOf(ownerWallet)
  const finalAccount1Balance = await token.balanceOf(accounts[1])
  const expectedOwnerBalance = initialOwnerBalance.sub(amount)
  const expectedAccount1Balance = initialAccount1Balance.add(amount)
  assert(
    finalOwnerBalance.eq(expectedOwnerBalance),
    'Expect owner balance to decrease'
  )
  assert(
    finalAccount1Balance.eq(expectedAccount1Balance),
    'Expect account 1 balance to increase'
  )
})
