import * as _lib from '../utils/lib.js'

const Registry = artifacts.require('./contract/Registry')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const TestContract = artifacts.require('./contract/TestContract')

contract('Registry', async (accounts) => {
  const contractName = _lib.strings.test

  const [, proxyAdminAddress, proxyDeployerAddress] = accounts

  let registry, initializeCallData

  beforeEach(async () => {
    const registry0 = await Registry.new({ from: proxyDeployerAddress })
    initializeCallData = _lib.encodeCall('initialize', [], [])
    const registryProxy = await AudiusAdminUpgradeabilityProxy.new(
      registry0.address,
      proxyAdminAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )

    registry = await Registry.at(registryProxy.address)

    assert.equal(await registry.owner.call(), proxyDeployerAddress)
    assert.equal(await registryProxy.getAudiusProxyAdminAddress.call(), proxyAdminAddress)
  })

  it('Confirm unregistered contract request returns 0 address', async () => {
    const contractAddress = await registry.getContract.call(contractName)
    assert.equal(parseInt(contractAddress), 0x0, "Expected same contract address")
  })

  it('Should fail to register a non-contract address', async () => {
    let nonContractAddress = accounts[8]
    assert.isTrue(web3.utils.isAddress(accounts[8]), 'Expect address')
    // Add non contract address
    // Confirm failure
    await _lib.assertRevert(registry.addContract(contractName, nonContractAddress))
  })

  it('Should add newly deployed contract to Registry', async () => {
    let testContract = await TestContract.new()
    await testContract.initialize()
    let testContractAddress = testContract.address

    let tx = await registry.addContract(contractName, testContractAddress, { from: proxyDeployerAddress })
    let txInfo = _lib.parseTx(tx)

    // assert event params are as expected
    assert.equal(txInfo.event.name, 'ContractAdded', 'Expected same event name')
    assert.equal(_lib.toStr(txInfo.event.args._name), _lib.toStr(contractName), 'Expected same contract name')
    assert.equal(txInfo.event.args._address, testContractAddress, 'Expected same contract address')

    // ensure registered contract has same address as originally deployed contract
    let regContractAddress = await registry.getContract.call(contractName)
    assert.equal(regContractAddress, testContractAddress, 'Expected same contract address')

    // change data on deployed contract and ensure registered contract instance reflects change
    let regContract = await TestContract.at(regContractAddress)
    let data0 = (await testContract.x.call()).toNumber()
    let regData0 = (await regContract.x.call()).toNumber()
    assert.equal(data0, regData0, 'Expected same contract data')
    await testContract.setX(data0 + 1)
    let data1 = (await testContract.x.call()).toNumber()
    let regData1 = (await regContract.x.call()).toNumber()
    assert.equal(data1, regData1, 'Expected same contract data')

    // ensure previous contract addresses (versions) are being stored
    let testContractVersionCount = (await registry.getContractVersionCount.call(contractName)).toNumber()
    assert.equal(testContractVersionCount, 1, 'Expected 1 version(s) of contract')
    // assert address for each available version
    let regContractAddressVersion1 = await registry.getContract.call(contractName, testContractVersionCount)
    let regContractAddressVersionLatest = await registry.getContract.call(contractName)
    assert.equal(regContractAddressVersion1, testContractAddress, 'Expected same contract address')
    assert.equal(regContractAddressVersionLatest, regContractAddressVersion1, 'Expected same contract address')
  })

  it('Fail to add contract under already registered key', async () => {
    const testContract = await TestContract.new()
    await testContract.initialize()

    await registry.addContract(contractName, testContract.address, { from: proxyDeployerAddress })

    const testContract2 = await TestContract.new()
    await testContract2.initialize()

    await _lib.assertRevert(
      registry.addContract(contractName, testContract2.address, { from: proxyDeployerAddress }),
      "Registry: Contract already registered with given name."
    )
  })

  it('Fail to add register 0 address', async () => {
    await _lib.assertRevert(
      registry.addContract(contractName, _lib.addressZero, { from: proxyDeployerAddress }),
      "Registry: Cannot register zero address."
    )
  })

  it('Fail to fetch contract with invalid version', async () => {
    await _lib.assertRevert(
      registry.getContract.call(contractName, 2),
      "Registry: Index out of range _version."
    )
  })

  it('Fail to remove unregistered contract', async () => {
    await _lib.assertRevert(
      registry.removeContract(contractName, { from: proxyDeployerAddress }),
      "Registry: Cannot remove - no contract registered with given _name."
    )
  })

  it('Fail to upgrade unregistered contract', async () => {
    const testContract = await TestContract.new()

    await _lib.assertRevert(
      registry.upgradeContract(contractName, testContract.address, { from: proxyDeployerAddress }),
      "Registry: Cannot upgrade - no contract registered with given _name."
    )
  })

  it('Fail to upgrade contract with zero address', async () => {
    let testContract = await TestContract.new()
    await testContract.initialize()

    // register testContract
    await registry.addContract(contractName, testContract.address, { from: proxyDeployerAddress })

    // upgrading this to a zero address should fail
    await _lib.assertRevert(
      registry.upgradeContract(contractName, _lib.addressZero, { from: proxyDeployerAddress }),
      "Cannot upgrade - cannot register zero address."
    )
  })

  it('Should remove registered contract', async () => {
    let testContract = await TestContract.new()
    await testContract.initialize()
    let testContractAddress = testContract.address

    // register contract and confirm successful registration
    await registry.addContract(contractName, testContractAddress, { from: proxyDeployerAddress })
    let regContractAddress = await registry.getContract.call(contractName)
    assert.equal(testContractAddress, regContractAddress, 'Expected same contract address')

    // unregister contract and confirm event params as expected and registered address = 0x0
    let removeTx = await registry.removeContract(contractName, { from: proxyDeployerAddress })
    let removeTxInfo = _lib.parseTx(removeTx)
    assert.equal(removeTxInfo.event.name, 'ContractRemoved', 'Expected same event name')
    assert.equal(_lib.toStr(removeTxInfo.event.args._name), _lib.toStr(contractName), 'Expected same contract name')
    assert.equal(removeTxInfo.event.args._address, regContractAddress, 'Expected same contract address')
    regContractAddress = await registry.getContract.call(contractName)
    assert.equal(parseInt(regContractAddress), 0x0, 'Expected zeroed contract address')

    // ensure previous contract addresses (versions) are being stored
    // after removing, there should be 2, the original deployment, plus the zeroed out (0x) address
    let testContractVersionCount = (await registry.getContractVersionCount.call(contractName)).toNumber()
    assert.equal(testContractVersionCount, 2, 'Expected 2 version(s) of contract')
    // assert address for each available version
    let regContractAddressVersion1 = await registry.getContract.call(contractName, 1)
    let regContractAddressVersion2 = await registry.getContract.call(contractName, 2)
    let regContractAddressVersionLatest = await registry.getContract.call(contractName)
    assert.equal(regContractAddressVersion1, testContractAddress, 'Expected same contract address')
    assert.equal(regContractAddressVersion2, 0x0, 'Expected zeroed contract address')
    assert.equal(regContractAddressVersionLatest, 0x0, 'Expected zeroed contract address')
  })

  it('Should upgrade registered contract', async () => {
    // declare three contracts. These are not added to the registry yet
    let testContract1 = await TestContract.new()
    await testContract1.initialize()
    let testContract2 = await TestContract.new()
    await testContract2.initialize()
    let testContract3 = await TestContract.new()
    await testContract3.initialize()

    let upgradeTx, upgradeTxInfo
    let regContractAddress

    // register testContract1 -> get registered contract -> assert addresses match
    await registry.addContract(contractName, testContract1.address, { from: proxyDeployerAddress })
    regContractAddress = await registry.getContract.call(contractName)
    assert.equal(testContract1.address, regContractAddress, 'Expected same contract address')

    // upgrade registered contract to testContract2 -> assert event params are as expected
    upgradeTx = await registry.upgradeContract(contractName, testContract2.address, { from: proxyDeployerAddress })
    upgradeTxInfo = _lib.parseTx(upgradeTx)

    regContractAddress = await registry.getContract.call(contractName)
    assert.equal(testContract2.address, regContractAddress, 'Expected same contract address')

    assert.equal(upgradeTxInfo.event.name, 'ContractUpgraded', 'Expected same event name')
    assert.equal(_lib.toStr(upgradeTxInfo.event.args._name), _lib.toStr(contractName), 'Expected same contract name')
    assert.equal(upgradeTxInfo.event.args._oldAddress, testContract1.address, 'Expected same contract address')
    assert.equal(upgradeTxInfo.event.args._newAddress, testContract2.address, 'Expected same contract address')

    // upgrade registered contract from testContract2 to testContract3 -> assert event params are as expected
    // ensures an upgraded contract can be upgraded again
    upgradeTx = await registry.upgradeContract(contractName, testContract3.address, { from: proxyDeployerAddress })
    upgradeTxInfo = _lib.parseTx(upgradeTx)

    regContractAddress = await registry.getContract.call(contractName)
    assert.equal(testContract3.address, regContractAddress, 'Expected same contract address')

    assert.equal(upgradeTxInfo.event.name, 'ContractUpgraded', 'Expected same event name')
    assert.equal(_lib.toStr(upgradeTxInfo.event.args._name), _lib.toStr(contractName), 'Expected same contract name')
    assert.equal(upgradeTxInfo.event.args._oldAddress, testContract2.address, 'Expected same contract address')
    assert.equal(upgradeTxInfo.event.args._newAddress, testContract3.address, 'Expected same contract address')

    // ensure previous contract addresses (versions) are being stored
    // after upgrading (twice), there should be 3 versions (original adding of contract + upgrade + upgrade)
    let testContractVersionCount = (await registry.getContractVersionCount.call(contractName)).toNumber()
    assert.equal(testContractVersionCount, 3, 'Expected 3 version(s) of contract')
    // assert address for each available version
    let regContractAddressVersion1 = await registry.getContract.call(contractName, 1)
    let regContractAddressVersion2 = await registry.getContract.call(contractName, 2)
    let regContractAddressVersion3 = await registry.getContract.call(contractName, 3)
    let regContractAddressVersionLatest = await registry.getContract.call(contractName)
    assert.equal(regContractAddressVersion1, testContract1.address, 'Expected same contract address')
    assert.equal(regContractAddressVersion2, testContract2.address, 'Expected same contract address')
    assert.equal(regContractAddressVersion3, testContract3.address, 'Expected same contract address')
    assert.equal(regContractAddressVersionLatest, regContractAddressVersion3, 'Expected same contract address')
  })

  it('Should upgrade registry and register contracts in two', async () => {
    // register contract
    const testContract = await TestContract.new()
    await testContract.initialize()
    await registry.addContract(contractName, testContract.address, { from: proxyDeployerAddress })

    // deploy new registry
    const registry2_0 = await Registry.new({ from: proxyDeployerAddress })
    const registry2Proxy = await AudiusAdminUpgradeabilityProxy.new(
      registry2_0.address,
      proxyAdminAddress,
      initializeCallData,
      { from: proxyDeployerAddress }
    )
    const registry2 = await Registry.at(registry2Proxy.address)

    // register in new registry
    await registry2.addContract(contractName, testContract.address, { from: proxyDeployerAddress })
  })
})
