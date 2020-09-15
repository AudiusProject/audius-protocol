const { current } = require("@openzeppelin/test-helpers/src/balance")
import * as _lib from '../utils/lib.js'

const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const StakingUpgraded = artifacts.require('StakingUpgraded')
const Governance = artifacts.require('Governance')
const GovernanceUpgraded = artifacts.require('GovernanceUpgraded')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const DelegateManager = artifacts.require('DelegateManager')
const ClaimsManager = artifacts.require('ClaimsManager')
const TestContract = artifacts.require('TestContract')
const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')

const serviceTypeCN = web3.utils.utf8ToHex('creator-node')
const serviceTypeDP = web3.utils.utf8ToHex('discovery-provider')

contract.only('Random testing', async (accounts) => {
    let token, staking, serviceTypeManager, serviceProviderFactory
    let claimsManager, governance, delegateManager
    // proxyDeployerAddress is used to transfer tokens to service accounts as needed
    const proxyDeployerAddress = accounts[11]

    let userOffset = 25 
    let users = []
    let numUsers = 5

    let minNumServicesPerUser = 1
    let maxNumServicesPerUser = 2 // TOOD: CONSUME THIS

    let numRounds = 2

    let cnTypeInfo, dpTypeInfo

    beforeEach(async () => {
        console.log(`Addresses from test`)
        console.log(`proxyDeployer: ${proxyDeployerAddress}`)
        token = await AudiusToken.at(process.env.tokenAddress)
        console.log(`AudiusToken: ${token.address}, expected ${process.env.tokenAddress}`)

        governance = await Governance.at(process.env.governanceAddress)
        console.log(`Governance: ${governance.address}, expected ${process.env.governanceAddress}`)

        console.log(`Deployer balance: ${token.balanceOf(proxyDeployerAddress).toString()}`)
        staking = await Staking.at(process.env.stakingAddress)
        console.log(`Staking: ${staking.address}, expected ${process.env.stakingAddress}`)
        claimsManager = await ClaimsManager.at(process.env.claimsManagerAddress)
        console.log(`ClaimsManager: ${claimsManager.address}, expected ${process.env.claimsManagerAddress}`)
        serviceProviderFactory = await ServiceProviderFactory.at(process.env.serviceProviderFactoryAddress)
        console.log(`ServiceProviderFactory: ${serviceProviderFactory.address}, expected ${process.env.serviceProviderFactoryAddress}`)

        let serviceTypeManagerAddrFromSPFactory = await serviceProviderFactory.getServiceTypeManagerAddress()
        console.log(`ServiceTypeManager Address from ServiceProviderFactory.sol: ${serviceTypeManagerAddrFromSPFactory}`)

        serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerAddrFromSPFactory)
        console.log(`ServiceTypeManager: ${serviceTypeManager.address}, expected ${serviceTypeManagerAddrFromSPFactory}`)


        const delManAddrFromClaimsManager = await claimsManager.getDelegateManagerAddress()
        delegateManager = await DelegateManager.at(delManAddrFromClaimsManager)
        console.log(`DelegateManager: ${delegateManager.address}, expected ${delManAddrFromClaimsManager}`)

        if (accounts.length < numUsers) {
            // Disabled for CI, pending modification of total accounts
            console.log(`Insufficient accounts found - required ${numUsers}, found ${accounts.length}`)
            return
        }

        users = accounts.slice(userOffset, userOffset + numUsers)
        cnTypeInfo = await serviceTypeManager.getServiceTypeInfo(serviceTypeCN)
        dpTypeInfo = await serviceTypeManager.getServiceTypeInfo(serviceTypeDP)
        console.log(`DP: ${serviceTypeDP}`)
        console.log(`CN: ${serviceTypeCN}`)
    })


    const rand = (min, max) => {
        return Math.floor(Math.random() * (max - min) + min)
    }

    const makeDummyEndpoint = (user, type) => {
        return `https://${user}-${type}:${rand(0, 10000000000)}`
    }

    const getUserServiceInfo = async (user) => {
        console.log(`${user} getServiceProviderIdsFromAddress NOT WORKING CN - ${user}, ${serviceTypeCN}`)
        let cnodeIds = await serviceProviderFactory.getServiceProviderIdsFromAddress(user, serviceTypeCN)
        console.log(`${user} - cnodeIds=${cnodeIds}`)
        if (!cnodeIds) { cnodeIds = [] }
        console.log(`${user} getServiceProviderIdsFromAddress NOT WORKING DP - ${user}, ${serviceTypeDP}`)
        let dpIds = await serviceProviderFactory.getServiceProviderIdsFromAddress(user, serviceTypeDP)
        console.log(`${user} - dpIds=${dpIds}`)
        if (!dpIds) { dpIds = [] }
        let numServices = cnodeIds.length + dpIds.length
        return {
            cnodeIds,
            dpIds,
            numServices
        }
    }

    const addNewServiceForUser = async (user) => {
        console.log(`${user} - Adding new service endpoint`)
        // 50% chance of disc prov, 50% chance of creator node
        let serviceTypeDiceRoll = rand(0, 100)
        let amount
        let serviceType
        // TODO: Improve rand amount calculation
        if (serviceTypeDiceRoll <= 50) {
            serviceType = serviceTypeCN
            amount = (cnTypeInfo.maxStake.sub(cnTypeInfo.minStake))
        } else {
            serviceType = serviceTypeDP
            amount = (dpTypeInfo.maxStake.sub(dpTypeInfo.minStake))
        }

        console.log(`${user} - ${serviceTypeDiceRoll} dice roll - adding ${web3.utils.hexToUtf8(serviceType)} - ${amount.toString()} audwei `)
        let currentBalance = await token.balanceOf(user)
        if (amount.gt(currentBalance)) {
            let missing = amount.sub(currentBalance)
            await token.transfer(user, missing, { from: proxyDeployerAddress })
            currentBalance = await token.balanceOf(user)
        }

        let serviceEndpoint = makeDummyEndpoint(user, web3.utils.hexToUtf8(serviceType))
        console.log(`${user} - adding endpoint=${serviceEndpoint} - amt=${amount.toString()}`)
        await _lib.registerServiceProvider(
            token,
            staking,
            serviceProviderFactory,
            serviceType,
            serviceEndpoint,
            amount,
            user
        )
        console.log(`${user} - registered endpoint ${serviceEndpoint}`)
        let foundSpID = await serviceProviderFactory.getServiceProviderIdFromEndpoint(serviceEndpoint)
        console.log(`${user} - endpoint=${serviceEndpoint}, id=${foundSpID}`)
    }

    // Add services as expected
    const processUserState = async (users) => {
        console.log('processUserState')
        await Promise.all(
            users.map(async (user) => {
                console.log(`${user} - minNumServices = ${minNumServicesPerUser}`)
                let userServiceInfo = await getUserServiceInfo(user)
                console.log(`${user} - numServices: ${userServiceInfo.numServices}`)
                if (userServiceInfo.numServices < minNumServicesPerUser) {
                    console.log(`${user} - Missing service`)
                    await addNewServiceForUser(user)
                } else {
                    console.log(`${user} - Satisifed service requirements`)
                }
            })
        )
    }

    describe('Random test cases', () => {
        it('sandbox', async () => {
            console.log(users)
            let currentRound = 1
            while (currentRound <= numRounds) {
                console.log(`------------------------ AUDIUS RANDOM TESTING - Round ${currentRound} ------------------------`)
                await processUserState(users)
                currentRound++
            }
        })
    })
})