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
    const governanceRegKey = web3.utils.utf8ToHex('Governance')
    const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')

    const userOffset = 25 
    // const numUsers = 1
    const numUsers = 5
    const minNumServicesPerUser = 1
    const maxNumServicesPerUser = 2 // TODO: CONSUME THIS

    const numRounds = 5

    // const numRounds = 15
    const fundingRoundBlockDiffForTest = 200

    const votingPeriod = 10 
    const executionDelayBlocks = 10

    const decreaseStakeLockupDuration = 21
    const deployerCutLockupDuration = 11

    // TODO: Add non-SP delegators after everything else

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

        await initializeTestState()
    })

    const initializeTestState = async () => {
        const curBlockDiff = await claimsManager.getFundingRoundBlockDiff.call()
        console.log(`Current block diff: ${curBlockDiff}`)

        // Local dev sanity config updates
        // https://github.com/AudiusProject/audius-protocol/commit/12116eede803b395a9518c707360e7b633cf6ad2

        // Update funding found block diff
        await governance.guardianExecuteTransaction(
            claimsManagerProxyKey,
            _lib.toBN(0),
            'updateFundingRoundBlockDiff(uint256)',
            _lib.abiEncode(['uint256'], [fundingRoundBlockDiffForTest]),
            { from: guardianAddress }
        )
        console.log(`Updated fundingRoundBlockDiff to ${fundingRoundBlockDiffForTest}`)
        const newBlockDiff = await claimsManager.getFundingRoundBlockDiff.call()
        console.log(`Updated fundingRoundBlockDiff from ClaimsManager: ${newBlockDiff}`)

        // Set voting period
        await governance.guardianExecuteTransaction(
            governanceRegKey,
            _lib.toBN(0),
            'setVotingPeriod(uint256)',
            _lib.abiEncode(['uint256'], [votingPeriod]),
            { from: guardianAddress }
        )
        console.log(`Updated votingPeriod to ${votingPeriod}`)

        // Set execution delay
        await governance.guardianExecuteTransaction(
            governanceRegKey,
            _lib.toBN(0),
            'setExecutionDelay(uint256)',
            _lib.abiEncode(['uint256'], [executionDelayBlocks]),
            { from: guardianAddress }
        )
        console.log(`Updated executionDelay to ${executionDelayBlocks}`)

        await governance.guardianExecuteTransaction(
            serviceProviderFactoryKey,
            _lib.toBN(0),
            'updateDecreaseStakeLockupDuration(uint256)',
            _lib.abiEncode(['uint256'], [decreaseStakeLockupDuration]),
            { from: guardianAddress }
        )
        console.log(`Updated decreaseStakeLockupDuration to ${decreaseStakeLockupDuration}`)
    }

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
            numServices,
            user
        }
    }

    const addNewServiceForUser = async (user) => {
        console.log(`${user} - Adding new service endpoint`)
        // 50% chance of disc prov, 50% chance of creator node
        let serviceTypeDiceRoll = rand(0, 100)
        let amount
        let serviceType
        let typeInfo = null
        // TODO: Improve rand amount calculation
        if (serviceTypeDiceRoll <= 50) {
            serviceType = serviceTypeCN
            typeInfo = cnTypeInfo
        } else {
            serviceType = serviceTypeDP
            typeInfo = dpTypeInfo
        }
        if(!typeInfo) throw new Error('Undefined type information')

        // Stash
        // amount = (dpTypeInfo.maxStake.sub(dpTypeInfo.minStake))
        amount = (typeInfo.maxStake.sub(typeInfo.minStake))
        // TEMP: Start with min stake
        // amount = (typeInfo.minStake.add(_lib.toBN(rand(0, 100000)))) // Min + random amount up to 100k WEI

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

    const delegate = async (target, amount, sender) => {
        try {
            let currentBalance = await token.balanceOf(sender)
            if (amount.gt(currentBalance)) {
                let missing = amount.sub(currentBalance)
                await token.transfer(sender, missing, { from: proxyDeployerAddress })
                currentBalance = await token.balanceOf(sender)
            }

            // Approve staking transfer
            await token.approve(
                staking.address,
                amount,
                { from: sender }
            )

            // Delegate valid min to SP 1
            await delegateManager.delegateStake(
                target,
                amount,
                { from: sender }
            )
        } catch (e) {
            console.error(`Error delegating ${amount} from ${sender} to ${target}`)
            // console.error(e)
        }
    }

    const randomlyDelegate = async (user) => {
        // 50% chance of delegation FROM this user
        let shouldDelegate = rand(0, 100)
        if (shouldDelegate < 50) return
        console.log(`${user} ------- Random delegation rolled ${shouldDelegate} -------`)
        let otherUsers = users.filter(x=>x!=user)
        let randTargetUser = otherUsers[Math.floor(Math.random()*otherUsers.length)];
        // Select between 100 and 500 AUD to delegate
        let amount = rand(100000000000000000000, 500000000000000000000)
        console.log(`${user} ------- Selected ${randTargetUser} SP, sending ${amount}`)
        await delegate(randTargetUser, _lib.toBN(amount), user)
        console.log(`${user} ------- End Random delegation`)
    }

    const randomlyDecreaseStake = async (user) => {
        let userInfo = await getAccountStakeInfo(user)
        // TODO: ENABLE RANDOMNESS
        // let shouldDecrease = rand(0, 100)
        // if (shouldDecrease < 50) return

        let pendingDecreaseReq = await serviceProviderFactory.getPendingDecreaseStakeRequest(user)
        let isRequestPending = !(pendingDecreaseReq.lockupExpiryBlock.eq(_lib.toBN(0)))
        let currentMaxForAcct = userInfo.spDetails.maxAccountStake
        let currentMinForAcct = userInfo.spDetails.minAccountStake
        let currentForDeployer = userInfo.spDetails.deployerStake
        let extraStake = currentForDeployer.sub(currentMaxForAcct)
        // let targetAmount = rand(currentMinForAcct.toNumber(), currentMaxForAcct.toNumber())
        // Decrease to the minimum bound
        let decreaseAmount = currentForDeployer.sub(currentMinForAcct)

        // If no request is pending and we are out of bounds, submit a decrease request
        if (!isRequestPending && !userInfo.spDetails.validBounds) {
            console.log(`${user} - randomlyDecreaseStake, validBounds: ${userInfo.spDetails.validBounds}, isRequestPending: ${isRequestPending}`)
            console.log(`${user} - randomlyDecreaseStake, currentMax: ${currentMaxForAcct}, currentForDeployer: ${currentForDeployer}, extraStake=${extraStake}, decreasing by ${decreaseAmount}`)
            console.log(`${user} - SUBMITTING`)
            await serviceProviderFactory.requestDecreaseStake(decreaseAmount, { from: user })
        } else if (isRequestPending) {
            let latestBlock = _lib.toBN((await web3.eth.getBlock('latest')).number)
            let readyToEvaluate = pendingDecreaseReq.lockupExpiryBlock.lte(latestBlock)
            console.log(`${user} - randomlyDecreaseStake lockupExpiryBlock: ${pendingDecreaseReq.lockupExpiryBlock}, latest=${latestBlock}, readyToEvaluate=${readyToEvaluate}`)
            if (readyToEvaluate) {
                await serviceProviderFactory.decreaseStake({ from: user })
                console.log(`${user} - Finished evaluating decrease stake request`)
            }
        }
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
            outsideStake,
            spDetails
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

    // Lower probability of claim to <100% but still high
    const claimPendingRewards = async (users) => {
        console.log(`------- Claiming Rewards -------`)
        let lastFundedBlock = await claimsManager.getLastFundedBlock()
        let totalAtFundBlock = await staking.totalStakedAt(lastFundedBlock)
        let fundsPerRound = await claimsManager.getFundsPerRound()
        console.log(`Round INFO lastFundBlock=${lastFundedBlock} - totalAtFundBlock=${totalAtFundBlock} - fundsPerRound=${fundsPerRound}`)
        // TODO: Randomize this here
        await Promise.all(
            users.map(
                async (user) => {
                    let preClaimInfo = await getAccountStakeInfo(user)
                    let totalForUserAtFundBlock = await staking.totalStakedForAt(user, lastFundedBlock)
                    console.log(`${user} - totalForUserAtFundBlock=${totalForUserAtFundBlock} - validBounds==${preClaimInfo.spDetails.validBounds}`)
                    let tx = await delegateManager.claimRewards(user, { from: user })
                    let postClaimInfo = await getAccountStakeInfo(user)
                    let rewards = postClaimInfo.totalInStakingContract.sub(preClaimInfo.totalInStakingContract)
                    console.log(`${user} - Claimed ${rewards}`)
                }
            )
        )
        console.log(`------- Finished Claiming Rewards -------`)
        await randomlyAdvanceBlocks()
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
        console.log(`latestBlock: ${latestBlock.number.toString()}`)
        await claimsManager.initiateRound({ from: user })
    }

    // After every single action, randomly decide to advance a random number of blocks
    const randomlyAdvanceBlocks = async () => {
        // 50% of randomly advancing blocks
        let shouldRandomlyAdvance = rand(0, 100)
        if (shouldRandomlyAdvance < 50) return
        // Randomly generate num blocks between 1 and 10
        let numBlocks = _lib.toBN(rand(1, 10))
        let latestBlock = await web3.eth.getBlock('latest')
        let latestBlockNumber = _lib.toBN(latestBlock.number)
        let targetBlockNumber = latestBlockNumber.add(numBlocks)
        try {
            console.log(`\n-- Randomly advancing ${numBlocks} blocks from ${latestBlockNumber} to ${targetBlockNumber}, ${shouldRandomlyAdvance}/100`)
            await time.advanceBlockTo(targetBlockNumber)
            latestBlock = await web3.eth.getBlock('latest')
            latestBlockNumber = _lib.toBN(latestBlock.number)
            console.log(`--- Advanced to ${latestBlockNumber}`)
        } catch(e) {
            console.log(e)
        }
    }

    // Add services as expected
    const processUserState = async (users) => {
        await Promise.all(
            users.map(async (user) => {
                let userServiceInfo = await getUserServiceInfo(user)
                if (userServiceInfo.numServices < minNumServicesPerUser) {
                    // In this case, our user has not
                    await addNewServiceForUser(user)
                } else {
                    console.log(`${user} - Satisifed service requirements`)
                    await randomlyDelegate(user)
                    await randomlyDecreaseStake(user)
                }
                // Randomly advance blocks
                await randomlyAdvanceBlocks()
            })
        )
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

                await claimPendingRewards(users)

                await validateUsers(users)
                console.log(`------------------------ AUDIUS RANDOM TESTING - Finished Round ${currentRound} ------------------------\n`)
                // Progress round
                currentRound++
            }
        })
    })
})