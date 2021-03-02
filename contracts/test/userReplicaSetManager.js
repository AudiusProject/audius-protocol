import * as _lib from './_lib/lib.js'
import {
    Registry,
    UserStorage,
    UserFactory,
    UserReplicaSetManager,
    TestUserReplicaSetManager,
    AdminUpgradeabilityProxy
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

const addressZero = '0x0000000000000000000000000000000000000000'

contract('UserReplicaSetManager', async (accounts) => {
    const deployer = accounts[0]
    const verifierAddress = accounts[2]
    const userId1 = 1
    const userAcct1 = accounts[3]
    const userId2 = 2
    const userAcct2 = accounts[4]
    // First spID = 1, account = accounts[3]
    const cnode1SpID = 1
    const cnode1DelegateOwnerWallet = accounts[5]
    const cnode1OwnerWallet = accounts[6]
    // Second spID = 2, accounts = accounts[4]
    const cnode2SpID = 2
    const cnode2DelegateOwnerWallet = accounts[7]
    const cnode2OwnerWallet = accounts[8]
    // Third spID = 3, accounts = accounts[5]
    const cnode3SpID = 3
    const cnode3DelegateOwnerWallet = accounts[9]
    const cnode3OwnerWallet = accounts[10]
    // Fourth spID = 4, accounts = accounts[6]
    const cnode4SpID = 4
    const cnode4DelegateOwnerWallet = accounts[11]
    const cnode4OwnerWallet = accounts[12]
    // Special permission addresses
    const userReplicaBootstrapAddress = accounts[24]
    // Proxy deployer is explicitly set
    const proxyAdminAddress = accounts[25]
    const bootstrapSPIds = [cnode1SpID, cnode2SpID, cnode3SpID, cnode4SpID]
    const bootstrapDelegateWallets = [cnode1DelegateOwnerWallet, cnode2DelegateOwnerWallet, cnode3DelegateOwnerWallet, cnode4DelegateOwnerWallet]
    const bootstrapOwnerWallets = [cnode1OwnerWallet, cnode2OwnerWallet, cnode3OwnerWallet, cnode4OwnerWallet]
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
               'uint'
           ],
           [
               registry.address,
               _constants.userFactoryKey,
               userReplicaBootstrapAddress,
               networkId
            ]
        )
        let proxyContractDeployTx = await AdminUpgradeabilityProxy.new(
           logicAddress,
           proxyAdminAddress,
           initializeUserReplicaSetManagerCalldata,
           { from: deployer }
        )

        userReplicaSetManager = await UserReplicaSetManager.at(proxyContractDeployTx.address)

        let seedComplete = await userReplicaSetManager.getSeedComplete({ from: userReplicaBootstrapAddress })
        assert.isFalse(seedComplete, "Expect no seed operation")
        let seedTx = await userReplicaSetManager.seedBootstrapNodes(
            bootstrapSPIds,
            bootstrapDelegateWallets,
            bootstrapOwnerWallets,
            { from: userReplicaBootstrapAddress }
        )
        seedComplete = await userReplicaSetManager.getSeedComplete({ from: userReplicaBootstrapAddress })
        assert.isTrue(seedComplete, "Expect completed seed operation")
        // Confirm constructor events were fired as expected
        await expectEvent.inTransaction(
            seedTx.tx,
            UserReplicaSetManager,
            'AddOrUpdateContentNode',
            {
                _cnodeSpId: toBN(cnode1SpID),
                _cnodeDelegateOwnerWallet: cnode1DelegateOwnerWallet,
                _cnodeOwnerWallet: cnode1OwnerWallet,
                _proposer1DelegateOwnerWallet: addressZero,
                _proposer2DelegateOwnerWallet: addressZero,
                _proposer3DelegateOwnerWallet: addressZero
           }
        )
        await expectEvent.inTransaction(
            seedTx.tx,
            UserReplicaSetManager,
            'AddOrUpdateContentNode',
            {
                _cnodeSpId: toBN(cnode2SpID),
                _cnodeDelegateOwnerWallet: cnode2DelegateOwnerWallet,
                _cnodeOwnerWallet: cnode2OwnerWallet,
                _proposer1DelegateOwnerWallet: addressZero,
                _proposer2DelegateOwnerWallet: addressZero,
                _proposer3DelegateOwnerWallet: addressZero
           }
        )
        await expectEvent.inTransaction(
            seedTx.tx,
            UserReplicaSetManager,
            'AddOrUpdateContentNode',
            {
                _cnodeSpId: toBN(cnode3SpID),
                _cnodeDelegateOwnerWallet: cnode3DelegateOwnerWallet,
                _cnodeOwnerWallet: cnode3OwnerWallet,
                _proposer1DelegateOwnerWallet: addressZero,
                _proposer2DelegateOwnerWallet: addressZero,
                _proposer3DelegateOwnerWallet: addressZero
           }
        )
        await expectEvent.inTransaction(
            seedTx.tx,
            UserReplicaSetManager,
            'AddOrUpdateContentNode',
            {
                _cnodeSpId: toBN(cnode4SpID),
                _cnodeDelegateOwnerWallet: cnode4DelegateOwnerWallet,
                _cnodeOwnerWallet: cnode4OwnerWallet,
                _proposer1DelegateOwnerWallet: addressZero,
                _proposer2DelegateOwnerWallet: addressZero,
                _proposer3DelegateOwnerWallet: addressZero
           }
        )
        // Validate proposers for AddOrUpdateContentNode events in bootstrap case
        assert.isTrue(seedTx.logs.length === 4, "Expected 4 emitted events")
        let event1Args = seedTx.logs[0].args
        let event2Args = seedTx.logs[1].args
        let event3Args = seedTx.logs[2].args
        let event4Args = seedTx.logs[3].args
        let event1ProposerSpIds = event1Args._proposerSpIds
        let event2ProposerSpIds = event2Args._proposerSpIds
        let event3ProposerSpIds = event3Args._proposerSpIds
        let event4ProposerSpIds = event4Args._proposerSpIds
        // Manually verify proposers are all spID=0
        // This is true only in the bootstrap case
        assert.isTrue(event1ProposerSpIds.length === 3, "Expected 3 entries")
        assert.isTrue(event2ProposerSpIds.length === 3, "Expected 3 entries")
        assert.isTrue(event3ProposerSpIds.length === 3, "Expected 3 entries")
        assert.isTrue(event4ProposerSpIds.length === 3, "Expected 3 entries")
        // Confirm all proposer spIDs are 0 for each of the 4 bootstrap events
        event1ProposerSpIds.forEach(x=>{ assert.isTrue(x.eq(toBN(0))) })
        event2ProposerSpIds.forEach(x=>{ assert.isTrue(x.eq(toBN(0))) })
        event3ProposerSpIds.forEach(x=>{ assert.isTrue(x.eq(toBN(0))) })
        event4ProposerSpIds.forEach(x=>{ assert.isTrue(x.eq(toBN(0))) })
   })

    // Confirm constructor arguments are respected on chain
    const validateBootstrapNodes = async () => {
        await validateBootstrapNodesInternal(userReplicaSetManager)
    }

    const validateBootstrapNodesInternal = async (contractInstance) => {
        // Manually query every constructor spID and confirm matching wallet on chain
        for (var i = 0; i < bootstrapSPIds.length; i++) {
            let spID = bootstrapSPIds[i]
            let cnodeDelegateWallet = bootstrapDelegateWallets[i]
            let cnodeOwnerWallet = bootstrapOwnerWallets[i]
            let walletInfoFromChain = await contractInstance.getContentNodeWallets(spID)
            assert.isTrue(
                cnodeDelegateWallet === walletInfoFromChain.delegateOwnerWallet,
                `Mismatched spID delegateOwnerWallet: Expected ${spID} w/wallet ${cnodeDelegateWallet}, found ${walletInfoFromChain.delegateOwnerWallet}`
            )
            assert.isTrue(
                cnodeOwnerWallet === walletInfoFromChain.ownerWallet,
                `Mismatched spID ownerWallet: Expected ${spID} w/wallet ${cnodeOwnerWallet}, found ${walletInfoFromChain.ownerWallet}`
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
        let updateTxResp = await _lib.updateReplicaSet(
            userReplicaSetManager,
            userId,
            newPrimary,
            newSecondaries,
            oldPrimary,
            oldSecondaries,
            senderAcct
        )
        let replicaSetFromChain = await userReplicaSetManager.getUserReplicaSet(userId)
        assert.isTrue(replicaSetFromChain.primaryId.eq(newPrimary), 'Primary mismatch')
        assert.isTrue(
            replicaSetFromChain.secondaryIds.every((replicaId, i) => replicaId.eq(newSecondaries[i])),
            'Secondary mismatch'
        )
        await expectEvent.inTransaction(
            updateTxResp.tx,
            UserReplicaSetManager,
            'UpdateReplicaSet',
            {
                _userId: toBN(userId),
                _primaryId: toBN(newPrimary),
                _signer: senderAcct
            }
        )
    }

    let generateProposeAddOrUpdateContentNodeData = async (
        chainId,
        newCNodeSPId,
        newCnodeDelegateWallet,
        newCnodeOwnerWallet,
        proposerSpId,
        proposerAccount
    ) => {
        const nonce = signatureSchemas.getNonce()
        const signatureData = signatureSchemas.generators.getProposeAddOrUpdateContentNodeRequestData(
            chainId,
            userReplicaSetManager.address,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
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

        let deployLogicTx = await UserReplicaSetManager.new({ from: deployer })
        let logicAddress = deployLogicTx.address

        // Encode the arguments to the 'initialize' function
        let userReplicaSetManagerInitData = encodeCall(
           'initialize',
           [
               'address',
               'bytes32',
               'address',
               'uint'
           ],
           [
               registry.address,
               _constants.userFactoryKey,
               userReplicaBootstrapAddress,
               networkId
            ]
        )
        // Deploy proxy contract
        let unSeededProxy = await AdminUpgradeabilityProxy.new(
            logicAddress,
            proxyAdminAddress,
            userReplicaSetManagerInitData,
            { from: deployer }
        )
        let localUrsmContract = await UserReplicaSetManager.at(unSeededProxy.address)
        // Confirm unseeded contract rejects operations
        await expectRevert(
            localUrsmContract.updateUserReplicaBootstrapAddress(
                accounts[20],
                { from: userReplicaBootstrapAddress }
            ),
            'Must be initialized'
        )
        // Confirm failure when called from non-bootstrap address
        await expectRevert(
            localUrsmContract.seedBootstrapNodes(
                bootstrapSPIds,
                bootstrapDelegateWallets,
                bootstrapOwnerWallets
            ),
            'Only callable by userReplicaSetBootstrapAddress'
        )
        // Confirm invalid bootstrap arguments are rejected
        // Create an intentionally mismatched length list of bootstrap spIDs<->delegateWallets
        const invalidSPIds = [cnode1SpID, cnode2SpID, cnode3SpID]
        await expectRevert(
            localUrsmContract.seedBootstrapNodes(
                invalidSPIds,
                bootstrapDelegateWallets,
                bootstrapOwnerWallets,
                { from: userReplicaBootstrapAddress }
            ),
            'Mismatched bootstrap array lengths'
        )
        // Create an intentionally mismatched length list of bootstrap spIDs<->ownerWallets
        const invalidBootstrapOwnerWallets = [cnode1OwnerWallet, cnode2OwnerWallet, cnode4OwnerWallet]
        await expectRevert(
            localUrsmContract.seedBootstrapNodes(
                bootstrapSPIds,
                bootstrapDelegateWallets,
                invalidBootstrapOwnerWallets,
                { from: userReplicaBootstrapAddress }
            ),
            'Mismatched bootstrap array lengths'
        )
    })

    it('Register additional nodes w/multiple signers (bootstrap nodes)', async () => {
        await validateBootstrapNodes()

        // Bootstrapped nodes = cn1/cn3/cn3
        // Proposers = cn1/cn2/cn3
        let newCNodeSPId = 10
        let newCnodeDelegateWallet = accounts[30]
        let newCnodeOwnerWallet = accounts[31]

        const chainIdForContract = getNetworkIdForContractInstance(userReplicaSetManager)

        // Generate proposer 1 relevant information (cn1)
        const cn1Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode1SpID,
            cnode1DelegateOwnerWallet
        )

        // Generate proposer 2 relevant information (cn2)
        const cn2Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode2SpID,
            cnode2DelegateOwnerWallet
        )

        // Generate proposer 3 relevant information (cn3)
        const cn3Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode3SpID,
            cnode3DelegateOwnerWallet
        )

        // Generate arguments for proposal
        const proposerSpIds = [cnode1SpID, cnode2SpID, cnode3SpID]
        const proposerNonces = [cn1Info.nonce, cn2Info.nonce, cn3Info.nonce]

        // Finally, submit tx with all 3 signatures
        let addContentNodeTx = await userReplicaSetManager.addOrUpdateContentNode(
            newCNodeSPId,
            [newCnodeDelegateWallet, newCnodeOwnerWallet],
            proposerSpIds,
            proposerNonces,
            cn1Info.sig,
            cn2Info.sig,
            cn3Info.sig
        )

        let walletInfoFromChain = await userReplicaSetManager.getContentNodeWallets(newCNodeSPId)
        let newDelegateWalletFromChain = walletInfoFromChain.delegateOwnerWallet
        assert.equal(newDelegateWalletFromChain, newCnodeDelegateWallet, 'Expect delegatOwnerWallet assignment')
        let newOwnerWalleFromChain = walletInfoFromChain.ownerWallet
        assert.equal(newOwnerWalleFromChain, newCnodeOwnerWallet, 'Expect delegatOwnerWallet assignment')
        await expectEvent.inTransaction(
            addContentNodeTx.tx,
            UserReplicaSetManager,
            'AddOrUpdateContentNode',
            {
                _cnodeSpId: toBN(newCNodeSPId),
                _cnodeDelegateOwnerWallet: newCnodeDelegateWallet,
                _proposer1DelegateOwnerWallet: cnode1DelegateOwnerWallet,
                _proposer2DelegateOwnerWallet: cnode2DelegateOwnerWallet,
                _proposer3DelegateOwnerWallet: cnode3DelegateOwnerWallet
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
                [newCnodeDelegateWallet, newCnodeOwnerWallet],
                proposerSpIds,
                proposerNonces,
                cn1Info.sig,
                cn2Info.sig,
                cn3Info.sig
            ),
            'Signature not unique'
        )
    })

    it('Fail to register additional nodes w/duplicate proposing delegateOwnerWallets', async () => {
        // Bootstrapped nodes = cn1/cn3/cn3
        // Proposers = cn1/cn2/cn3
        let newCNodeSPId = 10
        let newCnodeDelegateWallet = accounts[20]
        let newCnodeOwnerWallet = accounts[31]

        const chainIdForContract = getNetworkIdForContractInstance(userReplicaSetManager)
        // Generate proposer 1 relevant information (cn1)
        const cn1Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode1SpID,
            cnode1DelegateOwnerWallet
        )
        // Generate proposer 2 relevant information (cn2)
        const cn2Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode2SpID,
            cnode2DelegateOwnerWallet
        )
        // Generate 2nd proposer 2 relevant information, used to submit duplicate valid signature
        const cn2InfoDupe = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode2SpID,
            cnode2DelegateOwnerWallet
        )
        // Generate arguments for proposal
        // Include duplicate proposer - slots 2/3 are the same
        const proposerSpIds = [cnode1SpID, cnode2SpID, cnode2SpID]
        const proposerNonces = [cn1Info.nonce, cn2Info.nonce, cn2InfoDupe.nonce]
        // Finally, submit tx with dupe signatures
        await expectRevert(
            userReplicaSetManager.addOrUpdateContentNode(
                newCNodeSPId,
                [newCnodeDelegateWallet, newCnodeOwnerWallet],
                proposerSpIds,
                proposerNonces,
                cn1Info.sig,
                cn2Info.sig,
                cn2InfoDupe.sig
            ),
            "Distinct proposer delegateOwnerWallets required"
        )
    })

    it('Fail to register additional node w/duplicate proposing ownerWallet', async () => {
        // Register a new node with a duplicate ownerWallet
        // This is acceptable as there is a 1:many relationship in eth-contracts between
        //  ownerWallet -> delegateWallet
        // Bootstrapped nodes = cn1/cn3/cn3
        // Proposers = cn1/cn2/cn3
        const newCNodeSPId = 10
        const newCnodeDelegateWallet = accounts[30]
        // Shared ownerWallet with cn3
        const newCnodeOwnerWallet = cnode3OwnerWallet

        const chainIdForContract = getNetworkIdForContractInstance(userReplicaSetManager)

        // Generate proposer 1 relevant information (cn1)
        const cn1Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode1SpID,
            cnode1DelegateOwnerWallet
        )

        // Generate proposer 2 relevant information (cn2)
        const cn2Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode2SpID,
            cnode2DelegateOwnerWallet
        )

        // Generate proposer 3 relevant information (cn3)
        const cn3Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            newCNodeSPId,
            newCnodeDelegateWallet,
            newCnodeOwnerWallet,
            cnode3SpID,
            cnode3DelegateOwnerWallet
        )

        // Generate arguments for proposal
        const proposerSpIds = [cnode1SpID, cnode2SpID, cnode3SpID]
        const proposerNonces = [cn1Info.nonce, cn2Info.nonce, cn3Info.nonce]

        // Finally, submit tx with all 3 signatures
        let addContentNodeTx = await userReplicaSetManager.addOrUpdateContentNode(
            newCNodeSPId,
            [newCnodeDelegateWallet, newCnodeOwnerWallet],
            proposerSpIds,
            proposerNonces,
            cn1Info.sig,
            cn2Info.sig,
            cn3Info.sig
        )
        let walletInfoFromChain = await userReplicaSetManager.getContentNodeWallets(newCNodeSPId)
        let newDelegateWalletFromChain = walletInfoFromChain.delegateOwnerWallet
        assert.equal(newDelegateWalletFromChain, newCnodeDelegateWallet, 'Expect delegatOwnerWallet assignment')
        let newOwnerWalleFromChain = walletInfoFromChain.ownerWallet
        assert.equal(newOwnerWalleFromChain, newCnodeOwnerWallet, 'Expect delegatOwnerWallet assignment')
        await expectEvent.inTransaction(
            addContentNodeTx.tx,
            UserReplicaSetManager,
            'AddOrUpdateContentNode',
            {
                _cnodeSpId: toBN(newCNodeSPId),
                _cnodeDelegateOwnerWallet: newCnodeDelegateWallet,
                _proposer1DelegateOwnerWallet: cnode1DelegateOwnerWallet,
                _proposer2DelegateOwnerWallet: cnode2DelegateOwnerWallet,
                _proposer3DelegateOwnerWallet: cnode3DelegateOwnerWallet
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

        // Now, propose another node using newCnodeSpId=${newCNodeSPId} with ownerWallet=${newCnodeOwnerWallet}

        // Incoming node has no shared ownerWallet
        let secondNewCNodeSPId = 11
        let secondNewCnodeDelegateWallet = accounts[34]
        let secondNewCnodeOwnerWallet = accounts[40]

        // Generate proposer 1 relevant information spID=1
        const proposer1Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            secondNewCNodeSPId,
            secondNewCnodeDelegateWallet,
            secondNewCnodeOwnerWallet,
            cnode1SpID,
            cnode1DelegateOwnerWallet
        )

        // Generate proposer 2 relevant information spID=3
        const proposer2Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            secondNewCNodeSPId,
            secondNewCnodeDelegateWallet,
            secondNewCnodeOwnerWallet,
            cnode3SpID,
            cnode3DelegateOwnerWallet
        )

        // Generate proposer 3 relevant information spID=10
        // Duplicate owner wallet as spID=3
        const proposer3Info = await generateProposeAddOrUpdateContentNodeData(
            chainIdForContract,
            secondNewCNodeSPId,
            secondNewCnodeDelegateWallet,
            secondNewCnodeOwnerWallet,
            newCNodeSPId,
            newCnodeDelegateWallet
        )

        const secondProposerSpIds = [cnode1SpID, cnode3SpID, newCNodeSPId]
        const secondProposerNonces = [proposer1Info.nonce, proposer2Info.nonce, proposer3Info.nonce]

        // Confirm failure due to shared ownerWallet between proposer3 and proposer2 above
        await expectRevert(
            userReplicaSetManager.addOrUpdateContentNode(
                secondNewCNodeSPId,
                [secondNewCnodeDelegateWallet, secondNewCnodeOwnerWallet],
                secondProposerSpIds,
                secondProposerNonces,
                proposer1Info.sig,
                proposer2Info.sig,
                proposer3Info.sig
            ),
            'Distinct proposer ownerWallets required'
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
          updateReplicaSet(userId1, user1Primary, invalidUser1Secondaries, oldPrimary, oldSecondaries, cnode3DelegateOwnerWallet),
          'Secondary must exist'
        )
        // Perform secondary update from another valid secondary, cn3
        // Update secondaries to include cn4 and exclude cn5
        user1Secondaries = toBNArray([3, 4])
        // Try to issue an update from the incoming secondary account, confirm failure
        await expectRevert(
          updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, cnode4DelegateOwnerWallet),
          'Invalid update operation'
        )
        await updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, cnode3DelegateOwnerWallet)

        // Next, remove cn3 and add cn5 as a secondary from the PRIMARY account cn2
        oldPrimary = user1Primary
        oldSecondaries = user1Secondaries
        user1Primary = oldPrimary // No primary change
        user1Secondaries = toBNArray([4, 1])
        await updateReplicaSet(userId1, user1Primary, user1Secondaries, oldPrimary, oldSecondaries, cnode2DelegateOwnerWallet)
    })

    it('Configure replica set with duplicate IDs', async () => {
        // Validate behavior when >1 replica ID is duplicated in a single user's replica set
        let user1Primary = toBN(1)
        let user1Secondaries = toBNArray([1, 3])
        // Issue initial replica set selection from 1
        await expectRevert(
            updateReplicaSet(userId1, user1Primary, user1Secondaries, 0, [], userAcct1),
            'Distinct replica IDs expected'
        )
        // Confirm distinct update still works
        user1Primary = toBN(1)
        user1Secondaries = toBNArray([2, 3])
        updateReplicaSet(userId1, user1Primary, user1Secondaries, 0, [], userAcct1)
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
        let proxyInstance = await AdminUpgradeabilityProxy.at(proxyAddress)
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