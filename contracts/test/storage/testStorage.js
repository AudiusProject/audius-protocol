/* global web3, assert */
import * as _constants from '../utils/constants'
import { toStr } from '../utils/util'
import {
  Registry,
  TestStorage,
  TestContractWithStorage
} from '../_lib/artifacts.js'

contract('TestStorage', async (accounts) => {
  const key = web3.utils.utf8ToHex('key')
  const val = web3.utils.utf8ToHex('val')

  let registry

  before(async () => {
    registry = await Registry.new()
  })

  it('Should allow interaction with registered contracts', async () => {
    // deploy & register TestStorage & TestContractWithStorage
    let testStorage = await TestStorage.new(registry.address)
    await registry.addContract(_constants.testStorageKey, testStorage.address)
    let testContract = await TestContractWithStorage.new(registry.address, _constants.testStorageKey)
    await registry.addContract(_constants.testContractKey, testContract.address)

    // get contract address from registry
    let regTestContractAddress = await registry.getContract.call(_constants.testContractKey)

    // get registered testContract instance
    let regTestContract = await TestContractWithStorage.at(regTestContractAddress)

    // addData via registry
    await regTestContract.addData(key, val)

    // getData via registry
    let returnedData = toStr(await regTestContract.getData.call(key))

    // validate data
    assert.equal(returnedData, toStr(val), 'Expected same data')
  })
})
