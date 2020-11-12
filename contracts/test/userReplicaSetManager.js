import {
    Registry,
    UserStorage,
    UserFactory,
    UserReplicaSetManager
} from './_lib/artifacts.js'

import * as _constants from './utils/constants'

contract('UserReplicaSetManager', async (accounts) => {
    const deployer = accounts[0]
    const verifierAddress = accounts[2]
    const userId1 = 1
    const userAcct1 = accounts[3]
    const userId2 = 2
    const userAcct2 = accounts[4]
    // First spID = 1, account = accounts[3]
    const cnode1SpID = 1
    const cnode1Account = accounts[5]
    // Second spID = 2, accounts = accounts[4]
    const cnode2SpID = 2
    const cnode2Account = accounts[6]
    // Third spID = 3, accounts = accounts[5]
    const cnode3SpID = 3
    const cnode3Account = accounts[7]
    // Fourth spID = 4, accounts = accounts[6]
    const cnode4SpID = 4
    const cnode4Account = accounts[8]

    // Special permission addresses
    const nodeBootstrapAddress = accounts[12]
    const userReplicaBootstrapAddress = accounts[14]

    // Contract objects
    let registry
    let userStorage
    let userFactory
    let userReplicaSetManager

    beforeEach(async () => {
        // Initialize contract state
        registry = await Registry.new()
        const networkId = Registry.network_id
        // Add user storage and user factory
        userStorage = await UserStorage.new(registry.address)
        await registry.addContract(_constants.userStorageKey, userStorage.address)
        userFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, verifierAddress)
        await registry.addContract(_constants.userFactoryKey, userFactory.address)
        console.log('Initialized user factory')
        userReplicaSetManager = await UserReplicaSetManager.new(
            registry.address,
            _constants.userFactoryKey,
            nodeBootstrapAddress,
            userReplicaBootstrapAddress,
            networkId,
            { from: deployer }
        )
        console.log('Initialized user replica set manager')
    })

    /** Test Cases **/
    it.only('Configure artist replica set', async () => {
        console.log('we made it!')
        // const user1Primary = _lib.toBN(1)
        // const user1Secondaries = _lib.toBNArray([2, 3])
        // await updateReplicaSet(userId1, user1Primary, user1Secondaries, 0, [], userAcct1)
    })
})