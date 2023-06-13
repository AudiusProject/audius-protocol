import * as _lib from './_lib/lib.js'
import { parseTx } from './utils/parser'
import { toStr } from './utils/util'
import * as _constants from './utils/constants'
import {
  Registry,
  TestContract,
  UserStorage,
  TrackStorage,
  UserFactory,
  TrackFactory
} from './_lib/artifacts.js'
import { getUserFromFactory } from './utils/getters'
import { validateObj } from './utils/validator'

contract('Registry', async (accounts) => {
  const contractName = _constants.strings.test

  let registry

  beforeEach(async () => {
    registry = await Registry.new()
  })

  it('Should add newly deployed contract to Registry', async () => {
    let testContract = await TestContract.new(registry.address)
    let testContractAddress = testContract.address

    let tx = await registry.addContract(contractName, testContractAddress)
    let txInfo = parseTx(tx)

    // assert event params are as expected
    assert.equal(txInfo.event.name, 'ContractAdded', 'Expected same event name')
    assert.equal(
      toStr(txInfo.event.args._name),
      toStr(contractName),
      'Expected same contract name'
    )
    assert.equal(
      txInfo.event.args._address,
      testContractAddress,
      'Expected same contract address'
    )

    // ensure registered contract has same address as originally deployed contract
    let regContractAddress = await registry.getContract.call(contractName)
    assert.equal(
      regContractAddress,
      testContractAddress,
      'Expected same contract address'
    )

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
    let testContractVersionCount = (
      await registry.getContractVersionCount.call(contractName)
    ).toNumber()
    assert.equal(
      testContractVersionCount,
      1,
      'Expected 1 version(s) of contract'
    )
    // assert address for each available version
    let regContractAddressVersion1 = await registry.getContract.call(
      contractName,
      testContractVersionCount
    )
    let regContractAddressVersionLatest = await registry.getContract.call(
      contractName
    )
    assert.equal(
      regContractAddressVersion1,
      testContractAddress,
      'Expected same contract address'
    )
    assert.equal(
      regContractAddressVersionLatest,
      regContractAddressVersion1,
      'Expected same contract address'
    )
  })

  it('Should remove registered contract', async () => {
    let testContract = await TestContract.new(registry.address)
    let testContractAddress = testContract.address

    // register contract and confirm successful registration
    await registry.addContract(contractName, testContractAddress)
    let regContractAddress = await registry.getContract.call(contractName)
    assert.equal(
      testContractAddress,
      regContractAddress,
      'Expected same contract address'
    )

    // unregister contract and confirm event params as expected and registered address = 0x0
    let removeTx = await registry.removeContract(contractName)
    let removeTxInfo = parseTx(removeTx)
    assert.equal(
      removeTxInfo.event.name,
      'ContractRemoved',
      'Expected same event name'
    )
    assert.equal(
      toStr(removeTxInfo.event.args._name),
      toStr(contractName),
      'Expected same contract name'
    )
    assert.equal(
      removeTxInfo.event.args._address,
      regContractAddress,
      'Expected same contract address'
    )
    regContractAddress = await registry.getContract.call(contractName)
    assert.equal(
      parseInt(regContractAddress),
      0x0,
      'Expected zeroed contract address'
    )

    // ensure previous contract addresses (versions) are being stored
    // after removing, there should be 2, the original deployment, plus the zeroed out (0x) address
    let testContractVersionCount = (
      await registry.getContractVersionCount.call(contractName)
    ).toNumber()
    assert.equal(
      testContractVersionCount,
      2,
      'Expected 2 version(s) of contract'
    )
    // assert address for each available version
    let regContractAddressVersion1 = await registry.getContract.call(
      contractName,
      1
    )
    let regContractAddressVersion2 = await registry.getContract.call(
      contractName,
      2
    )
    let regContractAddressVersionLatest = await registry.getContract.call(
      contractName
    )
    assert.equal(
      regContractAddressVersion1,
      testContractAddress,
      'Expected same contract address'
    )
    assert.equal(
      regContractAddressVersion2,
      0x0,
      'Expected zeroed contract address'
    )
    assert.equal(
      regContractAddressVersionLatest,
      0x0,
      'Expected zeroed contract address'
    )
  })

  it('Should upgrade registered contract', async () => {
    // declare three contracts. These are not added to the registry yet
    let testContract1 = await TestContract.new(registry.address)
    let testContract2 = await TestContract.new(registry.address)
    let testContract3 = await TestContract.new(registry.address)

    let upgradeTx, upgradeTxInfo
    let regContractAddress

    // register testContract1 -> get registered contract -> assert addresses match
    await registry.addContract(contractName, testContract1.address)
    regContractAddress = await registry.getContract.call(contractName)
    assert.equal(
      testContract1.address,
      regContractAddress,
      'Expected same contract address'
    )

    // upgrade registered contract to testContract2 -> assert event params are as expected
    upgradeTx = await registry.upgradeContract(
      contractName,
      testContract2.address
    )
    upgradeTxInfo = parseTx(upgradeTx)

    regContractAddress = await registry.getContract.call(contractName)
    assert.equal(
      testContract2.address,
      regContractAddress,
      'Expected same contract address'
    )

    assert.equal(
      upgradeTxInfo.event.name,
      'ContractUpgraded',
      'Expected same event name'
    )
    assert.equal(
      toStr(upgradeTxInfo.event.args._name),
      toStr(contractName),
      'Expected same contract name'
    )
    assert.equal(
      upgradeTxInfo.event.args._oldAddress,
      testContract1.address,
      'Expected same contract address'
    )
    assert.equal(
      upgradeTxInfo.event.args._newAddress,
      testContract2.address,
      'Expected same contract address'
    )

    // upgrade registered contract from testContract2 to testContract3 -> assert event params are as expected
    // ensures an upgraded contract can be upgraded again
    upgradeTx = await registry.upgradeContract(
      contractName,
      testContract3.address
    )
    upgradeTxInfo = parseTx(upgradeTx)

    regContractAddress = await registry.getContract.call(contractName)
    assert.equal(
      testContract3.address,
      regContractAddress,
      'Expected same contract address'
    )

    assert.equal(
      upgradeTxInfo.event.name,
      'ContractUpgraded',
      'Expected same event name'
    )
    assert.equal(
      toStr(upgradeTxInfo.event.args._name),
      toStr(contractName),
      'Expected same contract name'
    )
    assert.equal(
      upgradeTxInfo.event.args._oldAddress,
      testContract2.address,
      'Expected same contract address'
    )
    assert.equal(
      upgradeTxInfo.event.args._newAddress,
      testContract3.address,
      'Expected same contract address'
    )

    // ensure previous contract addresses (versions) are being stored
    // after upgrading (twice), there should be 3 versions (original adding of contract + upgrade + upgrade)
    let testContractVersionCount = (
      await registry.getContractVersionCount.call(contractName)
    ).toNumber()
    assert.equal(
      testContractVersionCount,
      3,
      'Expected 3 version(s) of contract'
    )
    // assert address for each available version
    let regContractAddressVersion1 = await registry.getContract.call(
      contractName,
      1
    )
    let regContractAddressVersion2 = await registry.getContract.call(
      contractName,
      2
    )
    let regContractAddressVersion3 = await registry.getContract.call(
      contractName,
      3
    )
    let regContractAddressVersionLatest = await registry.getContract.call(
      contractName
    )
    assert.equal(
      regContractAddressVersion1,
      testContract1.address,
      'Expected same contract address'
    )
    assert.equal(
      regContractAddressVersion2,
      testContract2.address,
      'Expected same contract address'
    )
    assert.equal(
      regContractAddressVersion3,
      testContract3.address,
      'Expected same contract address'
    )
    assert.equal(
      regContractAddressVersionLatest,
      regContractAddressVersion3,
      'Expected same contract address'
    )
  })

  it('Should upgrade registry and re-point all registry contracts', async () => {
    // register contract
    let testContract = await TestContract.new(registry.address)
    await registry.addContract(contractName, testContract.address)

    // deploy new registry
    let registry2 = await Registry.new()

    // re-point testContract to new Registry
    await testContract.setRegistry(registry2.address)
    await registry2.addContract(contractName, testContract.address)
  })

  it('Should fail when a foreign account tries to re-point registry contracts to new registry', async () => {
    // register contract
    let testContract = await TestContract.new(registry.address)
    await registry.addContract(contractName, testContract.address)

    // deploy new registry
    let registry2 = await Registry.new()

    // attempt to re-point testContract to new registry from different account
    let caughtError = false
    try {
      await testContract.setRegistry(registry2.address, { from: accounts[5] })
      await registry2.addContract(contractName, testContract.address)
    } catch (e) {
      // handle expected error
      if (
        e.message.indexOf(
          'Can only be called if registryAddress is empty, msg.sender or owner'
        ) >= 0
      ) {
        caughtError = true
      } else {
        // other unexpected error - throw it normally
        throw e
      }
    }
    assert.isTrue(
      caughtError,
      'Failed to handle case where foreign account tries to re-point registry contracts to new registry'
    )
  })

  it('Should upgrade registry and re-point Audius contracts to new registry, and ensure expected behavior', async () => {
    // deploy contracts
    const networkId = Registry.network_id
    let userStorage = await UserStorage.new(registry.address)
    await registry.addContract(_constants.userStorageKey, userStorage.address)
    let trackStorage = await TrackStorage.new(registry.address)
    await registry.addContract(_constants.trackStorageKey, trackStorage.address)
    let userFactory = await UserFactory.new(
      registry.address,
      _constants.userStorageKey,
      networkId,
      accounts[5]
    )
    await registry.addContract(_constants.userFactoryKey, userFactory.address)
    let trackFactory = await TrackFactory.new(
      registry.address,
      _constants.trackStorageKey,
      _constants.userFactoryKey,
      networkId
    )
    await registry.addContract(_constants.trackFactoryKey, trackFactory.address)

    // perform expected behavior - add+validate user, add+validate track
    let userId = 1
    let trackId = 1
    let trackId2 = 2
    let userWallet = accounts[1]
    await _lib.addUserAndValidate(
      userFactory,
      userId,
      userWallet,
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      true
    )
    await _lib.addTrackAndValidate(
      trackFactory,
      trackId,
      userWallet,
      userId,
      _constants.testMultihash.digest2,
      _constants.testMultihash.hashFn,
      _constants.testMultihash.size
    )

    // deploy 'ugraded' registry
    let registry2 = await Registry.new()

    // re-point Audius contracts to new registry
    await userStorage.setRegistry(registry2.address)
    await registry2.addContract(_constants.userStorageKey, userStorage.address)
    await trackStorage.setRegistry(registry2.address)
    await registry2.addContract(
      _constants.trackStorageKey,
      trackStorage.address
    )
    await userFactory.setRegistry(registry2.address)
    await registry2.addContract(_constants.userFactoryKey, userFactory.address)
    await trackFactory.setRegistry(registry2.address)
    await registry2.addContract(
      _constants.trackFactoryKey,
      trackFactory.address
    )

    // perform expected behavior - retrieve+validate previous user; add+validate new track with previous user
    let user = await getUserFromFactory(userId, userFactory)
    validateObj(user, {
      wallet: userWallet,
      handle: toStr(_constants.userHandle1)
    })
    await _lib.addTrackAndValidate(
      trackFactory,
      trackId2,
      userWallet,
      userId,
      _constants.testMultihash.digest2,
      _constants.testMultihash.hashFn,
      _constants.testMultihash.size
    )
  })
})
