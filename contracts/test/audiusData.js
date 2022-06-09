import * as _lib from './_lib/lib.js'
import { getNetworkIdForContractInstance } from './utils/getters'
import {
    AudiusData,
    AdminUpgradeabilityProxy
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

const addressZero = '0x0000000000000000000000000000000000000000'

contract.only('AudiusData', async (accounts) => {
    const deployer = accounts[0]
    const verifierAddress = accounts[2]
    // Proxy deployer is explicitly set
    const proxyAdminAddress = accounts[25]

    let networkId
    // Contract objects
    let audiusDataContract

    beforeEach(async () => {
        // Deploy logic contract
        const deployLogicTx = await AudiusData.new({ from: deployer })
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

        audiusDataContract = await AudiusData.at(proxyContractDeployTx.address)
   })

   it('Manage user basic test', async () => {
     let testSigner = accounts[10]
     console.log(`Signer=${testSigner}`)
     const action = "Create"
     const metadata = "QmctAdxYym12fghF16DErS79GWPP5orEZoVXPC8F6XJwe9"
     const userId = 1
     const nonce = signatureSchemas.getNonce()
     const signatureData = signatureSchemas.generators.getManageUserData(
        getNetworkIdForContractInstance(audiusDataContract),
        audiusDataContract.address,
        userId,
        action,
        metadata,
        nonce
    )
    const sig = await eth_signTypedData(testSigner, signatureData)
    let tx = await audiusDataContract.manageUser(userId, action, metadata, nonce, sig)
    console.dir(tx, { depth: 5 })
   })

})