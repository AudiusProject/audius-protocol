import * as _lib from '../_lib/lib.js'
import {
  Registry,
  TestStorage,
  TestContractWithStorage } from '../_lib/artifacts.js'

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
    await registry.addContract(_lib.testStorageKey, testStorage.address)
    let testContract = await TestContractWithStorage.new(registry.address, _lib.testStorageKey)
    await registry.addContract(_lib.testContractKey, testContract.address)

    // get contract address from registry
    let regTestContractAddress = await registry.getContract.call(_lib.testContractKey)

    // get registered testContract instance
    let regTestContract = await TestContractWithStorage.at(regTestContractAddress)

    // addData via registry
    await regTestContract.addData(key, val)

    // getData via registry
    let returnedData = _lib.toStr(await regTestContract.getData.call(key))

    // validate data
    assert.equal(returnedData, _lib.toStr(val), 'Expected same data')
  })
})
