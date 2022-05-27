import * as _lib from './_lib/lib.js'
import {
    Registry,
    TestProofOfAudiusConsensus,
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

contract.only('ProofOfAudius', async (accounts) => {
    const deployer = accounts[0]
    const seedAddress = accounts[2]
    // Proxy deployer is explicitly set
    const proxyAdminAddress = accounts[25]
    // Contract objects
    let registry
    let poaContract
    let networkId

    let miningKeys = [accounts[4], accounts[5], accounts[6], accounts[7]]
    let ownerWallets = [accounts[8], accounts[9], accounts[10], accounts[10]]
    let testSystemAddress = accounts[11]
    beforeEach(async () => {
        // Initialize contract state
        registry = await Registry.new()
        networkId = Registry.network_id
        // Deploy logic contract
        let deployLogicTx = await TestProofOfAudiusConsensus.new({ from: deployer })
        let logicAddress = deployLogicTx.address
        let initializePoaContractData = encodeCall(
            'initialize',
            [
               'address',
               'uint'
            ],
            [
               seedAddress,
               networkId
            ]
        )
        let proxyContractDeployTx = await AdminUpgradeabilityProxy.new(
           logicAddress,
           proxyAdminAddress,
           initializePoaContractData,
           { from: deployer }
        )

        poaContract = await TestProofOfAudiusConsensus.at(proxyContractDeployTx.address)
   })

   it('Init test', async () => {
       let seederFromContract = await poaContract.seedAddress()

       console.log(await poaContract.systemAddress())

       await poaContract.seedValidators(miningKeys, ownerWallets, { from: seedAddress })
       await poaContract.testSetSystemAddress(testSystemAddress)

       let newValidatorMiningKey = accounts[12]
       let newValidatorOwnerKey = accounts[13]

    //    console.log(await poaContract.getValidators())

        console.log('--Initial')
        console.log(await poaContract.isValidator(newValidatorMiningKey))
        console.log(await poaContract.isValidatorFinalized(newValidatorMiningKey))
       await poaContract.addValidator(
           newValidatorMiningKey,
           newValidatorOwnerKey
        )

        console.log(await poaContract.isValidator(newValidatorMiningKey))
        console.log(await poaContract.isValidatorFinalized(newValidatorMiningKey))
        console.log('--Added')

        let tx = await poaContract.finalizeChange({
            from: testSystemAddress
        })
        console.log('--Finalized:')
        // console.log(tx)

        // console.log(await poaContract.getValidators())
        console.log(await poaContract.isValidator(newValidatorMiningKey))
        console.log(await poaContract.isValidatorFinalized(newValidatorMiningKey))
        console.log('--')

        await poaContract.removeValidator(
            newValidatorMiningKey
        )

        await poaContract.finalizeChange({
            from: testSystemAddress
        })

        console.log(await poaContract.isValidator(newValidatorMiningKey))
        console.log(await poaContract.isValidatorFinalized(newValidatorMiningKey))
        console.log('--')

        // console.log(await poaContract.getValidators())
   })
})