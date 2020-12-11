import * as _lib from './_lib/lib.js'
import {
    Registry,
    UserStorage,
    UserFactory,
    UserReplicaSetManager,
    TestUserReplicaSetManager,
    AudiusAdminUpgradeabilityProxy2
} from './_lib/artifacts.js'

import * as _constants from './utils/constants'
import { eth_signTypedData } from './utils/util'
import { getNetworkIdForContractInstance } from './utils/getters'

const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const abi = require('ethereumjs-abi')
const signatureSchemas = require('../signature_schemas/signatureSchemas')

const encodeCall = (name, args, values) => {
    const methodId = abi.methodID(name, args).toString('hex')
    const params = abi.rawEncode(args, values).toString('hex')
    return '0x' + methodId + params
}

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
    const userReplicaBootstrapAddress = accounts[14]
    // Proxy deployer is explicitly set
    const proxyAdminAddress = accounts[15]
    const bootstrapSPIds = [cnode1SpID, cnode2SpID, cnode3SpID, cnode4SpID]
    const bootstrapDelegateWallets = [cnode1Account, cnode2Account, cnode3Account, cnode4Account]
    // Contract objects
    let registry
    let userStorage
    let userFactory
    let userReplicaSetManager
    let networkId

    beforeEach(async () => {
        // Initialize contract state
        registry = await Registry.new()
        networkId = Registry.network_id
        // Add user storage and user factory
        userStorage = await UserStorage.new(registry.address)
        await registry.addContract(_constants.userStorageKey, userStorage.address)
        userFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, verifierAddress)
        await registry.addContract(_constants.userFactoryKey, userFactory.address)
        // Initialize users to POA UserFactory
        await registerInitialUsers()
        // Deploy logic contract
        let deployLogicTx = await UserReplicaSetManager.new({ from: deployer })
        let logicAddress = deployLogicTx.address
        let initializeUserReplicaSetManagerCalldata = encodeCall(
           'initialize',
           [
               'address',
               'bytes32',
               'address',
               'uint[]',
               'address[]',
               'uint'
           ],
           [
               registry.address,
               _constants.userFactoryKey,
               userReplicaBootstrapAddress,
               bootstrapSPIds,
               bootstrapDelegateWallets,
               networkId
            ]
        )
        let proxyContractDeployTx = await AudiusAdminUpgradeabilityProxy2.new(
           logicAddress,
           proxyAdminAddress,
           initializeUserReplicaSetManagerCalldata,
           { from: deployer }
        )
        userReplicaSetManager = await UserReplicaSetManager.at(proxyContractDeployTx.address)
    })

    // Confirm constructor arguments are respected on chain
    const validateBootstrapNodes = async () => {
        await validateBootstrapNodesInternal(userReplicaSetManager)
    }

    const validateBootstrapNodesInternal = async (contractInstance) => {
        // Manually query every constructor spID and confirm matching wallet on chain
        for (var i = 0; i < bootstrapSPIds.length; i++) {
            let spID = bootstrapSPIds[i]
            let cnodeWallet = bootstrapDelegateWallets[i]
            let walletFromChain = await contractInstance.getContentNodeWallet(spID)
            assert.isTrue(
                cnodeWallet === walletFromChain,
                `Mismatched spID wallet: Expected ${spID} w/wallet ${cnodeWallet}, found ${walletFromChain}`
            )
        }
    }

    // Helper Functions
    // Initial 2 users registered to test UserFactory
    let registerInitialUsers = async () => {
        await _lib.addUserAndValidate(
            userFactory,
            userId1,
            userAcct1,
            _constants.testMultihash.digest1,
            _constants.userHandle1,
            true
        )
        await _lib.addUserAndValidate(
            userFactory,
            userId2,
            userAcct2,
            _constants.testMultihash.digest1,
            _constants.userHandle2,
            true
        )
    }

    const toBN = (val) => web3.utils.toBN(val)

    const toBNArray = (bnArray) => { return bnArray.map(x => toBN(x)) }

    let updateReplicaSet = async (userId, newPrimary, newSecondaries, oldPrimary, oldSecondaries, senderAcct) => {
        // console.log(`Updating user=${userId} from ${oldPrimary},${oldSecondaries} to ${newPrimary},${newSecondaries} from ${senderAcct}`)
        await _lib.updateReplicaSet(
            userReplicaSetManager,
            userId,
            newPrimary,
            newSecondaries,
            oldPrimary,
            oldSecondaries,
            senderAcct
        )
        let replicaSetFromChain = await userReplicaSetManager.getUserReplicaSet(userId)
        assert.isTrue(replicaSetFromChain.primary.eq(newPrimary), 'Primary mismatch')
        assert.isTrue(replicaSetFromChain.secondaries.every((replicaId, i) => replicaId.eq(newSecondaries[i])), 'Secondary mismatch')
    }

    let generateProposeAddOrUpdateContentNodeData = async (chainId, newCNodeSPId, newCnodeDelegateWallet, proposerSpId, proposerAccount) => {
        const nonce = signatureSchemas.getNonce()
        const signatureData = signatureSchemas.generators.getProposeAddOrUpdateContentNodeRequestData(
            chainId,
            userReplicaSetManager.address,
            newCNodeSPId,
            newCnodeDelegateWallet,
            proposerSpId,
            nonce
        )
        const sig = await eth_signTypedData(proposerAccount, signatureData)
        return {
            nonce,
            signatureData,
            sig
        }
    }

    /** Test Cases **/
    it('Validate constructor bootstrap arguments', async () => {
        // Confirm constructor arguments validated
        await validateBootstrapNodes()

        // Create an intentionally mismatched length list of bootstrap spIDs<->delegateWallets
        const invalidSPIds = [cnode1SpID, cnode2SpID, cnode3SpID]
        let deployLogicTx = await UserReplicaSetManager.new({ from: deployer })
        let logicAddress = deployLogicTx.address

        // Encode the arguments to the 'initialize' function
        let userReplicaSetManagerInitData = encodeCall(
           'initialize',
           [
               'address',
               'bytes32',
               'address',
               'uint[]',
               'address[]',
               'uint'
           ],
           [
               registry.address,
               _constants.userFactoryKey,
               userReplicaBootstrapAddress,
               invalidSPIds,
               bootstrapDelegateWallets,
               networkId
            ]
        )
        // Revert message is not propagated for constructor failures
        await expectRevert.unspecified(
            AudiusAdminUpgradeabilityProxy2.new(
                logicAddress,
                proxyAdminAddress,
                userReplicaSetManagerInitData,
                { from: deployer }
            )
        )
    })

    it('Register additional nodes w/multiple signers (bootstrap nodes)', async () => {
        // Bootstrapped nodes = cn1/cn3/cn3
        // Proposers = cn1/cn2/cn3
        let newCNodeSPId = 10
        let newCnodeDelegateWallet = accounts[20]

        const chainIdForContract = getNetworkIdForContractInstance(userReplicaSetManager)

        // Generate proposer 1 relevant information (cn1)
        const cn1Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            cnode1SpID,
            cnode1Account
        )

        // Generate proposer 2 relevant information (cn2)
        const cn2Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            cnode2SpID,
            cnode2Account
        )

        // Generate proposer 3 relevant information (cn3)
        const cn3Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            cnode3SpID,
            cnode3Account
        )

        // Generate arguments for proposal
        const proposerSpIds = [cnode1SpID, cnode2SpID, cnode3SpID]
        const proposerNonces = [cn1Info.nonce, cn2Info.nonce, cn3Info.nonce]

        // Finally, submit tx with all 3 signatures
        let addContentNodeTx = await userReplicaSetManager.addOrUpdateContentNode(
            newCNodeSPId,
            newCnodeDelegateWallet,
            proposerSpIds,
            proposerNonces,
            cn1Info.sig,
            cn2Info.sig,
            cn3Info.sig
        )

        let newDelegateWalletFromChain = await userReplicaSetManager.getContentNodeWallet(newCNodeSPId)
        assert.equal(newDelegateWalletFromChain, newCnodeDelegateWallet, 'Expect wallet assignment')
        await expectEvent.inTransaction(
            addContentNodeTx.tx,
            UserReplicaSetManager,
            'AddOrUpdateContentNode',
            {
                _newCnodeId: toBN(newCNodeSPId),
                _newCnodeDelegateOwnerWallet: newCnodeDelegateWallet,
                _proposer1Address: cnode1Account,
                _proposer2Address: cnode2Account,
                _proposer3Address: cnode3Account
            }
        )
        // Validate array emitted from event
        let eventArgs = addContentNodeTx.logs[0].args
        let eventProposerSpIds = eventArgs._proposerSpIds
        assert.equal(
            eventProposerSpIds.length,
            proposerSpIds.length,
            "Expect correct number of proposer IDs in AddOrUpdateContentNode event"
        )
        // Manually verify each ID from event
        const proposerSpIdsBn = proposerSpIds.map(x=>toBN(x))
        for (var i = 0; i < proposerSpIdsBn.length; i++){
            assert.isTrue(eventProposerSpIds[i].eq(proposerSpIdsBn[i]))
        }

        // Reuse same nonce and signature from above and confirm failure
        await expectRevert(
            userReplicaSetManager.addOrUpdateContentNode(
                newCNodeSPId,
                newCnodeDelegateWallet,
                proposerSpIds,
                proposerNonces,
                cn1Info.sig,
                cn2Info.sig,
                cn3Info.sig
            ),
            'Signature not unique'
        )
    })

    it('Fail to register additional nodes w/duplicate bootstrap signers', async () => {
        // Bootstrapped nodes = cn1/cn3/cn3
        // Proposers = cn1/cn2/cn3
        let newCNodeSPId = 10
        let newCnodeDelegateWallet = accounts[20]
        const chainIdForContract = getNetworkIdForContractInstance(userReplicaSetManager)
        // Generate proposer 1 relevant information (cn1)
        const cn1Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            cnode1SpID,
            cnode1Account
        )
        // Generate proposer 2 relevant information (cn2)
        const cn2Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            cnode2SpID,
            cnode2Account
        )
        // Generate 2nd proposer 2 relevant information, used to submit duplicate valid signature
        const cn2InfoDupe = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            cnode2SpID,
            cnode2Account
        )
        // Generate arguments for proposal
        // Include duplicate proposer - slots 2/3 are the same
        const proposerSpIds = [cnode1SpID, cnode2SpID, cnode2SpID]
        const proposerNonces = [cn1Info.nonce, cn2Info.nonce, cn2InfoDupe.nonce]
        // Finally, submit tx with dupe signatures
        await expectRevert(
            userReplicaSetManager.addOrUpdateContentNode(
                newCNodeSPId,
                newCnodeDelegateWallet,
                proposerSpIds,
                proposerNonces,
                cn1Info.sig,
                cn2Info.sig,
                cn2InfoDupe.sig
            ),
            "Distinct proposers required"
        )
    })

    it('Configure + update user replica set', async () => {
        let user1Primary = toBN(1)
        let user1Secondaries = toBNArray([2, 3])
        // Issue initial replica set selection from 1
        await updateReplicaSet(userId1, user1Primary, user1Secondaries, 0, [], userAcct1)
        // Fail with out of date prior configuration
        await expectRevert(
          updateReplicaSet(userId1, user1Primary, user1Secondaries, 0, [], userAcct1),
          'Invalid prior primary configuration'
        )
        await expectRevert(
          updateReplicaSet(userId1, user1Primary, user1Secondaries, user1Primary, [], userAcct1),
          'Invalid prior secondary configuration'
        )
        // Move cn1 from primary to secondary from userAcct directly
        let oldPrimary = user1Primary
        let oldSecondaries = user1Secondaries
        user1Primary = toBN(2)
        user1Secondaries = toBNArray([3, 1])
        await updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, userAcct1)

        // Swap out secondary cn1 for cn4 from cn3
        oldPrimary = user1Primary
        oldSecondaries = user1Secondaries
        let invalidUser1Secondaries = toBNArray([3, 5])
        // 5 is an invalid ID, confirm failure to update
        await expectRevert(
          updateReplicaSet(userId1, user1Primary, invalidUser1Secondaries, oldPrimary, oldSecondaries, cnode3Account),
          'Secondary must exist'
        )
        // Perform secondary update from another valid secondary, cn3
        // Update secondaries to include cn4 and exclude cn5
        user1Secondaries = toBNArray([3, 4])
        // Try to issue an update from the incoming secondary account, confirm failure
        await expectRevert(
          updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, cnode4Account),
          'Invalid update operation'
        )
        await updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, cnode3Account)

        // Next, remove cn3 and add cn5 as a secondary from the PRIMARY account cn2
        oldPrimary = user1Primary
        oldSecondaries = user1Secondaries
        user1Primary = oldPrimary // No primary change
        user1Secondaries = toBNArray([4, 1])
        await updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, cnode2Account)
    })

    it('userReplicaBootstrapAddress functionality', async () => {
        let user1Primary = toBN(1)
        let user1Secondaries = toBNArray([2, 3])
        // Issue initial replica set selection from userReplicaBootstrapAddress
        await updateReplicaSet(
            userId1,
            user1Primary,
            user1Secondaries,
            0,
            [],
            userReplicaBootstrapAddress
        )
        let userReplicaBootstrapAddressOnChain = await userReplicaSetManager.getUserReplicaSetBootstrapAddress()
        assert.equal(
            userReplicaBootstrapAddressOnChain,
            userReplicaBootstrapAddress,
            `Expected ${userReplicaBootstrapAddress}, found ${userReplicaBootstrapAddressOnChain}`
        )
        const addressZero = '0x0000000000000000000000000000000000000000'
        // Confirm failure if update function sent from wrong address
        await expectRevert(
            userReplicaSetManager.updateUserReplicaBootstrapAddress(addressZero),
            'Invalid sender, expect current userReplicaSetBootstrapAddress'
        )
        // Confirm address update to zero works as expected, effectively relinquishing control
        await userReplicaSetManager.updateUserReplicaBootstrapAddress(addressZero, { from: userReplicaBootstrapAddress })
        userReplicaBootstrapAddressOnChain = await userReplicaSetManager.getUserReplicaSetBootstrapAddress()
        assert.equal(
            userReplicaBootstrapAddressOnChain,
            addressZero,
            `Expected ${addressZero}, found ${userReplicaBootstrapAddressOnChain}`
        )
    })

    it('Fail to register replica set for non-existent user', async () => {
        const nonExistentUserID = 5
        let user1Primary = toBN(1)
        let user1Secondaries = toBNArray([2, 3])
        // Issue initial replica set selection from 1
        await expectRevert(
            updateReplicaSet(nonExistentUserID, user1Primary, user1Secondaries, 0, [], userAcct1),
            'Valid user required'
        )
    })

    it('UserReplicaSetManager Proxy upgrade validation', async () => {
        // Confirm constructor arguments validated
        await validateBootstrapNodes()
        // Confirm upgrade function does not yet exist on deployed UserReplicaSetManager
        let newFunctionFailure = false
        try {
            // Note that this fails prior to reaching chain
            await userReplicaSetManager.newFunction()
        } catch (e) {
            if (e.message.includes('not a function')) {
                newFunctionFailure = true
            }
        }
        assert.isTrue(newFunctionFailure, "Unexpected success")
        // Confirm that newFunction does not exist
        let deployUpgradedLogicContract = await TestUserReplicaSetManager.new({ from: deployer })
        let upgradedLogicAddress = deployUpgradedLogicContract.address
        let proxyAddress = userReplicaSetManager.address
        let proxyInstance = await AudiusAdminUpgradeabilityProxy2.at(proxyAddress)
        // Attempt to upgrade from an invalid address (the initial deployer)
        await expectRevert(
            proxyInstance.upgradeTo(upgradedLogicAddress, { from: deployer }),
            'revert'
        )
        // Perform upgrade from known admin
        await proxyInstance.upgradeTo(upgradedLogicAddress, { from: proxyAdminAddress })
        let testUserReplicaSetManager = await TestUserReplicaSetManager.at(proxyAddress)
        // Confirm bootstrap node information still exists after upgrade
        await validateBootstrapNodesInternal(testUserReplicaSetManager)
        // Validate upgraded function
        let newFunctionReturnValue = await testUserReplicaSetManager.newFunction()
        assert.isTrue(newFunctionReturnValue.eq(toBN(5)), "New function returned unexpected value")
    })
})