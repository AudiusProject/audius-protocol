const { current } = require("@openzeppelin/test-helpers/src/balance")
import * as _lib from '../utils/lib.js'
const { time } = require('@openzeppelin/test-helpers')

const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const DelegateManager = artifacts.require('DelegateManager')
const ClaimsManager = artifacts.require('ClaimsManager')
const AudiusToken = artifacts.require('AudiusToken')

const serviceTypeCN = web3.utils.utf8ToHex('creator-node')
const serviceTypeDP = web3.utils.utf8ToHex('discovery-provider')

contract.only('Random testing', async (accounts) => {
    let token, staking, serviceTypeManager, serviceProviderFactory
    let claimsManager, governance, delegateManager
    let users = []
    let cnTypeInfo, dpTypeInfo
    // proxyDeployerAddress is used to transfer tokens to service accounts as needed
    const proxyDeployerAddress = accounts[11]
    // guardian is equal to proxyDeployer for test purposes
    const guardianAddress = proxyDeployerAddress
    const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
    const userOffset = 25 
    const numUsers = 1
    // const numUsers = 5
    const minNumServicesPerUser = 1
    const maxNumServicesPerUser = 2 // TOOD: CONSUME THIS
    const numRounds = 2
    const fundingRoundBlockDiffForTest = 200

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

        const curBlockDiff = await claimsManager.getFundingRoundBlockDiff.call()
        console.log(`Current block diff: ${curBlockDiff}`)

        // Update funding found block diff
        await governance.guardianExecuteTransaction(
            claimsManagerProxyKey,
            _lib.toBN(0),
            'updateFundingRoundBlockDiff(uint256)',
            _lib.abiEncode(['uint256'], [fundingRoundBlockDiffForTest]),
            { from: guardianAddress }
        )
        const newBlockDiff = await claimsManager.getFundingRoundBlockDiff.call()
        console.log(`Updated block diff: ${newBlockDiff}`)
    })


    const rand = (min, max) => {
        return Math.floor(Math.random() * (max - min) + min)
    }

    const makeDummyEndpoint = (user, type) => {
        return `https://${user}-${type}:${rand(0, 10000000000)}`
    }

    const getUserServiceInfo = async (user) => {
        let cnodeIds = await serviceProviderFactory.getServiceProviderIdsFromAddress(user, serviceTypeCN)
        if (!cnodeIds) { cnodeIds = [] }
        let dpIds = await serviceProviderFactory.getServiceProviderIdsFromAddress(user, serviceTypeDP)
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
        // Confirm system is internally consistent for this user
        await validateAccountStakeBalance(user)
    }

    // Add services as expected
    const processUserState = async (users) => {
        console.log('processUserState')
        await Promise.all(
            users.map(async (user) => {
                let userServiceInfo = await getUserServiceInfo(user)
                if (userServiceInfo.numServices < minNumServicesPerUser) {
                    await addNewServiceForUser(user)
                } else {
                    console.log(`${user} - Satisifed service requirements`)
                }
            })
        )
    }

    const getAccountStakeInfo = async (account) => {
        let spDetails = await serviceProviderFactory.getServiceProviderDetails(account)
        let spFactoryStake = spDetails.deployerStake
        let totalInStakingContract = await staking.totalStakedFor(account)
        let totalDelegatedToSP = await delegateManager.getTotalDelegatedToServiceProvider(account)
        let outsideStake = spFactoryStake.add(totalDelegatedToSP)
        return {
            totalInStakingContract,
            spFactoryStake,
            totalDelegatedToSP,
            outsideStake
        }
    }

    const validateAccountStakeBalance = async (account) => {
        let info = await getAccountStakeInfo(account)
        let infoStr = `totalInStakingContract=${info.totalInStakingContract.toString()}, outside=${info.outsideStake.toString()}`
        assert.isTrue(
          info.totalInStakingContract.eq(info.outsideStake),
          `Imbalanced stake for account ${account} - ${infoStr}`
        )
        console.log(`${account} - ${infoStr}`)
        return info
    }

    const validateUsers = async (users) => {
        console.log(`------- Validating User State -------`)
        await Promise.all(users.map(async (user) => {
            await validateAccountStakeBalance(user)
        }))
        console.log(`------- Finished Validating User State -------`)
    }

    const claimPendingRewards = async (users) => {
        console.log(`------- Claiming Rewards -------`)
        let lastFundedBlock = await claimsManager.getLastFundedBlock()
        let totalAtFundBlock = await staking.totalStakedAt(lastFundedBlock)
        let fundsPerRound = await claimsManager.getFundsPerRound()
        console.log(`Round INFO lastFundBlock=${lastFundedBlock} - totalAtFundBlock=${totalAtFundBlock} - fundsPerRound=${fundsPerRound}`)
        // TODO: Randomize this here
        await Promise.all(users.map(async (user) => {
            let preClaimInfo = await getAccountStakeInfo(user)
            let totalForUserAtFundBlock = await staking.totalStakedForAt(user, lastFundedBlock)
            let spInfo = await serviceProviderFactory.getServiceProviderDetails(user)
            console.log(spInfo)
            console.log(`${user} - totalForUserAtFundBlock=${totalForUserAtFundBlock}`)
            let tx = await delegateManager.claimRewards(user, { from: user })
            console.dir(tx, { depth: 5 })
            let postClaimInfo = await getAccountStakeInfo(user)
            let rewards = postClaimInfo.totalInStakingContract.sub(preClaimInfo.totalInStakingContract)
            console.log(`${user} - Claimed ${rewards}`)
        }))
        console.log(`------- Finished Claiming Rewards -------`)
        /*
            3142465753420000000000000 * 1342465753420000000000000 / 3142465753420000000000000
        */
    }

    const initiateRound = async (user) => {
        console.log(`------- Initiating Round -------`)
        let lastFundedBlock = await claimsManager.getLastFundedBlock()
        console.log(`lastFundedBlock: ${lastFundedBlock.toString()}`)
        let fundingRoundDiff = await claimsManager.getFundingRoundBlockDiff()
        console.log(`fundingRoundDiff: ${fundingRoundDiff.toString()}`)
        let nextFundingRoundBlock = lastFundedBlock.add(fundingRoundDiff)
        console.log(`nextFundingRoundBlock: ${nextFundingRoundBlock.toString()}`)
        let latestBlock = await web3.eth.getBlock('latest')
        if (nextFundingRoundBlock.gte(_lib.toBN(latestBlock.number))) {
            try {
                await time.advanceBlockTo(nextFundingRoundBlock.add(_lib.toBN(1)))
            } catch(e) {
                console.log(`Caught ${e} advancing blocks`)
            }
        }
        console.log(`latestBlock: ${latestBlock.toString()}`)
        await claimsManager.initiateRound({ from: user })
    }

    describe('Random test cases', () => {
        it('sandbox', async () => {
            console.log(users)
            let currentRound = 1
            while (currentRound <= numRounds) {
                console.log(`------------------------ AUDIUS RANDOM TESTING - Round ${currentRound} ------------------------`)
                // Ensure base user state (service requirements satisfied)
                await processUserState(users)

                // TODO: Randomize from which acct the round is initiated
                await initiateRound(users[0])

                // TODO: CLAIM IN EACH ROUND
                await claimPendingRewards(users)

                await validateUsers(users)
                // Progress round
                currentRound++
            }
        })
    })
})