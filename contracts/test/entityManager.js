import * as _lib from './_lib/lib.js'
import {
    EntityManager,
    AdminUpgradeabilityProxy,
    TestEntityManager
} from './_lib/artifacts.js'

import * as _constants from './utils/constants'

import { eth_signTypedData } from './utils/util'

const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const abi = require('ethereumjs-abi')
const signatureSchemas = require('../signature_schemas/signatureSchemas')

const encodeCall = (name, args, values) => {
    const methodId = abi.methodID(name, args).toString('hex')
    const params = abi.rawEncode(args, values).toString('hex')
    return '0x' + methodId + params
}

const toBN = (val) => web3.utils.toBN(val)

contract('EntityManager', async (accounts) => {
    const deployer = accounts[0]
    const verifierAddress = accounts[2]
    const proxyAdminAddress = accounts[25]
    let testSigner = accounts[10]

    let networkId
    // Contract objects
    let entityManagerContract

    beforeEach(async () => {
        // Deploy logic contract
        const deployLogicTx = await EntityManager.new({ from: deployer })
        const logicAddress = deployLogicTx.address
        networkId = await web3.eth.net.getId()
        let initializeContractData = encodeCall(
            'initialize',
            [
               'address',
               'uint'
            ],
            [
               verifierAddress,
               networkId
            ]
        )
        let proxyContractDeployTx = await AdminUpgradeabilityProxy.new(
           logicAddress,
           proxyAdminAddress,
           initializeContractData,
           { from: deployer }
        )

        entityManagerContract = await EntityManager.at(proxyContractDeployTx.address)
   })

   it('Manage entity', async () => {
     const action = 'Create'
     const metadata = 'QmctAdxYym12fghF16DErS79GWPP5orEZoVXPC8F6XJwe9'
     const userId = 1
     const entityType = 'Track'
     const entityId = 1
     const nonce = signatureSchemas.getNonce()
     const signatureData = signatureSchemas.generators.getManageEntityData(
        networkId,
        entityManagerContract.address,
        userId,
        entityType,
        entityId,
        action,
        metadata,
        nonce
     )
     const sig = await eth_signTypedData(testSigner, signatureData)
     let manageTx = await entityManagerContract.manageEntity(
        userId,
        entityType,
        entityId,
        action,
        metadata,
        nonce,
        sig
    )
    await expectEvent.inTransaction(
        manageTx.tx,
        EntityManager,
        'ManageEntity',
        {
            _userId: toBN(userId),
            _signer: testSigner,
            _metadata: metadata,
            _action: action
        }
    )
   })

   it('Verifier basic test', async () => {
        await expectRevert(
           entityManagerContract.manageIsVerified(1, false),
           'Invalid verifier'
        )

        let verifyTx = await entityManagerContract.manageIsVerified(1, true, { from: verifierAddress })
        await expectEvent.inTransaction(
            verifyTx.tx,
            EntityManager,
            'ManageIsVerified',
            {
                _userId: toBN(1),
                _isVerified: true
            }
        )
   })

   it('EntityManager upgradeability validation', async () => {
        // Attempt to reinitialize
        await expectRevert(
            entityManagerContract.initialize(verifierAddress, networkId),
            'Contract instance has already been initialized.'
        )
        let deployUpgradedLogicContract = await TestEntityManager.new({ from: deployer })
        let proxyInstance = await AdminUpgradeabilityProxy.at(entityManagerContract.address)
        const upgradedLogicAddress = deployUpgradedLogicContract.address
        // Attempt to upgrade from an invalid address (the initial deployer)
        await expectRevert(
            proxyInstance.upgradeTo(upgradedLogicAddress, { from: deployer }),
            'revert'
        )
        // Perform upgrade from known admin
        await proxyInstance.upgradeTo(upgradedLogicAddress, { from: proxyAdminAddress })
        let testEntityManager = await TestEntityManager.at(entityManagerContract.address)
        let newFunctionReturnValue = await testEntityManager.newFunction()
        assert.isTrue(newFunctionReturnValue.eq(toBN(5)), "New function returned unexpected value")
        // Confirm existing functionality
        let verifyTx = await testEntityManager.manageIsVerified(1, true, { from: verifierAddress })
        await expectEvent.inTransaction(
            verifyTx.tx,
            EntityManager,
            'ManageIsVerified',
            {
                _userId: toBN(1),
                _isVerified: true
            }
        )
    })
})