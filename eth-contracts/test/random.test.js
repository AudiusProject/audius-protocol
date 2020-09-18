import { web3 } from '@openzeppelin/test-helpers/src/setup'
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
    let logs = {}
    let cnTypeInfo, dpTypeInfo
    let currentRound = 1

    // proxyDeployerAddress is used to transfer tokens to service accounts as needed
    const proxyDeployerAddress = accounts[11]
    // guardian is equal to proxyDeployer for test purposes
    const guardianAddress = proxyDeployerAddress
    const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
    const governanceRegKey = web3.utils.utf8ToHex('Governance')
    const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
    const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')

    const userOffset = 25 

    // const numUsers = 1
    const numUsers = 5
    const minNumServicesPerUser = 1
    const maxNumServicesPerUser = 2 // TODO: CONSUME THIS

    const numRounds = 5

    // const numRounds = 15
    const FundingRoundBlockDiffForTest = 200
    const VotingPeriod = 10 
    const ExecutionDelayBlocks = 10
    const UndelegateLockupDuration = 21

    const DecreaseStakeLockupDuration = 21
    // const deployerCutLockupDuration = 11

    const SystemUser = "system"
    // const TestDuration = 10000 //30s=30000, 3min=180000
    const TestDuration = 360000 // 720000

    // TODO: Add non-SP delegators after everything else
    beforeEach(async () => {
        // Select user slice
        users = accounts.slice(userOffset, userOffset + numUsers)
        // Initialize in memory log
        logs[SystemUser] = []
        users.map((user)=>{ logs[user] = []})
        token = await AudiusToken.at(process.env.tokenAddress)
        governance = await Governance.at(process.env.governanceAddress)
        staking = await Staking.at(process.env.stakingAddress)
        claimsManager = await ClaimsManager.at(process.env.claimsManagerAddress)
        serviceProviderFactory = await ServiceProviderFactory.at(process.env.serviceProviderFactoryAddress)
        let serviceTypeManagerAddrFromSPFactory = await serviceProviderFactory.getServiceTypeManagerAddress()
        serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerAddrFromSPFactory)
        const delManAddrFromClaimsManager = await claimsManager.getDelegateManagerAddress()
        delegateManager = await DelegateManager.at(delManAddrFromClaimsManager)
        if (accounts.length < numUsers) {
            // Disabled for CI, pending modification of total accounts
            sysLog(`Insufficient accounts found - required ${numUsers}, found ${accounts.length}`)
            return
        }
        cnTypeInfo = await serviceTypeManager.getServiceTypeInfo(serviceTypeCN)
        dpTypeInfo = await serviceTypeManager.getServiceTypeInfo(serviceTypeDP)
        sysLog(`proxyDeployer: ${proxyDeployerAddress}`)
        sysLog(`AudiusToken: ${token.address}, expected ${process.env.tokenAddress}`)
        sysLog(`Governance: ${governance.address}, expected ${process.env.governanceAddress}`)
        sysLog(`Deployer balance: ${(await token.balanceOf(proxyDeployerAddress)).toString()}`)
        sysLog(`Staking: ${staking.address}, expected ${process.env.stakingAddress}`)
        sysLog(`ClaimsManager: ${claimsManager.address}, expected ${process.env.claimsManagerAddress}`)
        sysLog(`ServiceProviderFactory: ${serviceProviderFactory.address}, expected ${process.env.serviceProviderFactoryAddress}`)
        sysLog(`ServiceTypeManager Address from ServiceProviderFactory.sol: ${serviceTypeManagerAddrFromSPFactory}`)
        sysLog(`ServiceTypeManager: ${serviceTypeManager.address}, expected ${serviceTypeManagerAddrFromSPFactory}`)
        sysLog(`DelegateManager: ${delegateManager.address}, expected ${delManAddrFromClaimsManager}`)
        sysLog(`CN: ${serviceTypeCN} - min: ${cnTypeInfo.minStake}, max: ${cnTypeInfo.maxStake}`)
        sysLog(`DP: ${serviceTypeDP} - min: ${dpTypeInfo.minStake}, max: ${dpTypeInfo.maxStake}`)
        await initializeTestState()
    })

    const initializeTestState = async () => {
        const curBlockDiff = await claimsManager.getFundingRoundBlockDiff.call()
        sysLog(`Current block diff: ${curBlockDiff}`)
        // Local dev sanity config updates
        // https://github.com/AudiusProject/audius-protocol/commit/12116eede803b395a9518c707360e7b633cf6ad2
        // Update funding found block diff
        await governance.guardianExecuteTransaction(
            claimsManagerProxyKey,
            _lib.toBN(0),
            'updateFundingRoundBlockDiff(uint256)',
            _lib.abiEncode(['uint256'], [FundingRoundBlockDiffForTest]),
            { from: guardianAddress }
        )
        sysLog(`Updated fundingRoundBlockDiff to ${FundingRoundBlockDiffForTest}`)
        const newBlockDiff = await claimsManager.getFundingRoundBlockDiff.call()
        sysLog(`Updated fundingRoundBlockDiff from ClaimsManager: ${newBlockDiff}`)
        // Set voting period
        await governance.guardianExecuteTransaction(
            governanceRegKey,
            _lib.toBN(0),
            'setVotingPeriod(uint256)',
            _lib.abiEncode(['uint256'], [VotingPeriod]),
            { from: guardianAddress }
        )
        sysLog(`Updated VotingPeriod to ${VotingPeriod}`)
        // Set execution delay
        await governance.guardianExecuteTransaction(
            governanceRegKey,
            _lib.toBN(0),
            'setExecutionDelay(uint256)',
            _lib.abiEncode(['uint256'], [ExecutionDelayBlocks]),
            { from: guardianAddress }
        )
        sysLog(`Updated executionDelay to ${ExecutionDelayBlocks}`)
        await governance.guardianExecuteTransaction(
            serviceProviderFactoryKey,
            _lib.toBN(0),
            'updateDecreaseStakeLockupDuration(uint256)',
            _lib.abiEncode(['uint256'], [DecreaseStakeLockupDuration]),
            { from: guardianAddress }
        )
        sysLog(`Updated decreaseStakeLockupDuration to ${DecreaseStakeLockupDuration}`)
        await governance.guardianExecuteTransaction(
            delegateManagerKey,
            _lib.toBN(0),
            'updateUndelegateLockupDuration(uint256)',
            _lib.abiEncode(['uint256'], [UndelegateLockupDuration]),
            { from: guardianAddress }
        )
        sysLog(`Updated undelegateLockupDuration to ${UndelegateLockupDuration}`)
    }

    const rand = (min, max) => {
        return Math.floor(Math.random() * (max - min) + min)
    }

    // Convert from wei -> eth to generate a random number
    // Helper converts back to wei prior to returning 
    const randAmount = (min, max) => {
        let minNum = fromWei(min)
        let maxNum = fromWei(max)
        let randNum = rand(minNum, maxNum)
        return _lib.toBN(web3.utils.toWei(randNum.toString(), 'ether'))
    }

    const makeDummyEndpoint = (user, type) => {
        return `https://${user}-${type}:${rand(0, 10000000000)}`
    }

    const fromWei = (bn) => {
        return web3.utils.fromWei(bn.toString(), 'ether')
    }

    const testLog = (user, msg) => {
        let time = new Date().toUTCString()
        if (user !== SystemUser) {
            console.log(`${time} | ${user} - ${msg}`)
        } else {
            console.log(`${time} | ${msg}`)
        }
        logs[user].push({
            user,
            time,
            currentRound,
            msg
        })
    }

    const sysLog = (msg) => {
        testLog(SystemUser, msg)
    }

    const logTestSummary = () => {
        let logKeys = Object.keys(logs)
        // Iterate over every user and print summary
        for (var key of logKeys) {
            console.log(`\n --------------- User ${key} ----------------`)
            let userLogs = logs[key]
            for (var entry of userLogs) {
                console.log(`${entry.user} | ${entry.time} | Round=${entry.currentRound} | ${entry.msg}`)
            }
        }
    }

    const logCurrentBlock = async () => {
        let latestBlock = _lib.toBN((await web3.eth.getBlock('latest')).number)
        sysLog(`currentBlock - ${latestBlock}`)
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
        testLog(user, 'Adding new service endpoint')
        try {
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

            // Randomly generate an amount between min/max bounds
            amount = randAmount(typeInfo.minStake, typeInfo.maxStake)
            if (amount.lt(typeInfo.minStake)) amount = typeInfo.minStake

            // amount = (typeInfo.minStake.add(_lib.toBN(rand(0, 100000)))) // Min + random amount up to 100k WEI
            testLog(user, `${serviceTypeDiceRoll} dice roll - adding ${web3.utils.hexToUtf8(serviceType)} - ${amount.toString()} audwei `)
            let currentBalance = await token.balanceOf(user)
            if (amount.gt(currentBalance)) {
                let missing = amount.sub(currentBalance)
                await token.transfer(user, missing, { from: proxyDeployerAddress })
                currentBalance = await token.balanceOf(user)
            }

            let serviceEndpoint = makeDummyEndpoint(user, web3.utils.hexToUtf8(serviceType))
            testLog(user, `adding endpoint=${serviceEndpoint} - amt=${amount.toString()}`)
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
        } catch (e) {
            testLog(user, `Error registering service provider. ${e}`)
        }
    }

    const delegate = async (serviceProvider, amount, delegator) => {
        try {
            let currentBalance = await token.balanceOf(delegator)
            if (amount.gt(currentBalance)) {
                let missing = amount.sub(currentBalance)
                await token.transfer(delegator, missing, { from: proxyDeployerAddress })
                currentBalance = await token.balanceOf(delegator)
            }
            // Approve staking transfer
            await token.approve(
                staking.address,
                amount,
                { from: delegator }
            )
            // Delegate valid min to SP 1
            await delegateManager.delegateStake(
                serviceProvider,
                amount,
                { from: delegator }
            )
            testLog(delegator, `Delegated ${amount} to TargetSP=${serviceProvider}`)
        } catch (e) {
            testLog(delegator, `Error delegating ${amount} from ${delegator} to ${serviceProvider}. ${e}`)
        }
    }

    const randomlyDelegate = async (user) => {
        // 50% chance of delegation FROM this user
        let shouldDelegate = rand(0, 100)
        if (shouldDelegate < 50) return
        let otherUsers = users.filter(x=>x!=user)
        let randTargetUser = otherUsers[Math.floor(Math.random()*otherUsers.length)];
        let targetInfo = await getAccountStakeInfo(randTargetUser)
        let targetMax = targetInfo.spDetails.maxAccountStake
        let current = targetInfo.totalInStakingContract
        if (!targetInfo.spDetails.validBounds) {
            testLog(user, `randomlyDelegate: target ${randTargetUser} out of bounds. current=${current}, max=${targetMax}`)
            return
        }
        let maxDelAmount = targetMax.sub(current)
        // Select between 100 and 500 AUD to delegate
        let amount = _lib.toBN(rand(100000000000000000000, 500000000000000000000))
        testLog(user, `randomlyDelegate: maxDelAmt=${maxDelAmount}, targetMax=${targetMax}, current=${current}, selected=${amount}`)
        await delegate(randTargetUser, _lib.toBN(amount), user)
    }

    // TODO: Follow up w/roneil about the following:
    //  Total delegated BY a delegator - should we track this in contract state?
    //  When decreasing stake, should the total validation be on sum in staking or deployer?
    //          Or should the SP boot delegator in this case?
    //   
    const randomlyUndelegate = async (user) => {
        let pendingUndelegateReq = await delegateManager.getPendingUndelegateRequest(user, { from: user })
        let isRequestPending = !(pendingUndelegateReq.lockupExpiryBlock.eq(_lib.toBN(0)))
        let otherUsers = users.filter(x=>x!=user)
        // key = sp address
        // value = amount delegated by 'user' specified in function arg
        let delegatorInformation = {}
        let validDelegator = false
        await Promise.all(otherUsers.map(async (otherSpAddress) => {
            let delStakeForOtherSp = await delegateManager.getDelegatorStakeForServiceProvider(user, otherSpAddress)
            testLog(user, `randomlyUndelegate: otherSP: ${otherSpAddress} delStakeForOtherSp=${delStakeForOtherSp}`)
            if (!delStakeForOtherSp.gt(_lib.toBN(0))) return
            delegatorInformation[otherSpAddress] = delStakeForOtherSp
            validDelegator = true
        }))
        testLog(user, `randomlyUndelegate: validDelegator: ${validDelegator} isRequestPending=${isRequestPending}`)
        if (validDelegator) {
            testLog(user, `randomlyUndelegate: ${JSON.stringify(delegatorInformation)}`)
            let undelegateTargetSP = Object.keys(delegatorInformation)
            let randomlySelectedUndelegateTarget = undelegateTargetSP[Math.floor(Math.random()*undelegateTargetSP.length)];
            testLog(user, `randomlyUndelegate: target=${randomlySelectedUndelegateTarget}, amtDel'dToSP=${delegatorInformation[randomlySelectedUndelegateTarget]}`)
        }
    }

    const randomlyDecreaseStake = async (user) => {
        let userInfo = await getAccountStakeInfo(user)
        let pendingDecreaseReq = await serviceProviderFactory.getPendingDecreaseStakeRequest(user)
        let isRequestPending = !(pendingDecreaseReq.lockupExpiryBlock.eq(_lib.toBN(0)))
        let currentMaxForAcct = userInfo.spDetails.maxAccountStake
        let currentMinForAcct = userInfo.spDetails.minAccountStake
        let currentForDeployer = userInfo.spDetails.deployerStake
        // let targetAmount = rand(currentMinForAcct.toNumber(), currentMaxForAcct.toNumber())

        // Decrease to the minimum bound
        let decreaseAmount = currentForDeployer.sub(currentMinForAcct)
        try {
            // If no request is pending and we are out of bounds, submit a decrease request
            if (!isRequestPending && !userInfo.spDetails.validBounds) {
                let totalAfterDecrease = userInfo.totalInStakingContract.sub(decreaseAmount)
                let decreaseToValidBounds = totalAfterDecrease.gte(currentMinForAcct) && totalAfterDecrease.lte(currentMaxForAcct)
                testLog(user, `randomlyDecreaseStake, validBounds: ${userInfo.spDetails.validBounds}, max: ${currentMaxForAcct}, deployer: ${currentForDeployer}, staking=${userInfo.totalInStakingContract}, decreasing by ${decreaseAmount}, totalAfterDecrease=${totalAfterDecrease}, decreaseToValidBounds=${decreaseToValidBounds}`)
                await serviceProviderFactory.requestDecreaseStake(decreaseAmount, { from: user })
            } else if (isRequestPending) {
                let latestBlock = _lib.toBN((await web3.eth.getBlock('latest')).number)
                let readyToEvaluate = pendingDecreaseReq.lockupExpiryBlock.lte(latestBlock)
                if (readyToEvaluate) {
                    await serviceProviderFactory.decreaseStake({ from: user })
                    testLog(user, `randomlyDecreaseStake request evaluated | lockupExpiryBlock: ${pendingDecreaseReq.lockupExpiryBlock}, latest=${latestBlock}, readyToEvaluate=${readyToEvaluate}`)
                }
            } else {
                // TODO: ENABLE RANDOMNESS
                //       Should randomly issue a decrease request tow ithin bounds
                // let shouldDecrease = rand(0, 100)
                // if (shouldDecrease < 50) return
            }
        } catch(e) {
            testLog(user, `Error decreasing stake by ${decreaseAmount} for ${user} ${e}`)
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
        let infoStr = `validation | totalInStakingContract=${info.totalInStakingContract.toString()}, outside=${info.outsideStake.toString()} (spFactoryStake=${info.spFactoryStake} delegation=${info.totalDelegatedToSP})`
        assert.isTrue(
          info.totalInStakingContract.eq(info.outsideStake),
          `Imbalanced stake for account ${account} - ${infoStr}`
        )
        testLog(account, infoStr)
        return info
    }

    const validateUsers = async (users) => {
        sysLog(`------- Validating User State -------`)
        await Promise.all(users.map(async (user) => {
            await validateAccountStakeBalance(user)
        }))
        sysLog(`------- Finished Validating User State -------`)
    }

    // Lower probability of claim to <100% but still high
    const claimPendingRewards = async (users) => {
        sysLog(`------- Claiming Rewards -------`)
        let lastFundedBlock = await claimsManager.getLastFundedBlock()
        let totalAtFundBlock = await staking.totalStakedAt(lastFundedBlock)
        let fundsPerRound = await claimsManager.getFundsPerRound()
        sysLog(`Round INFO lastFundBlock=${lastFundedBlock} - totalAtFundBlock=${totalAtFundBlock} - fundsPerRound=${fundsPerRound}`)
        // TODO: Randomize this here
        await Promise.all(
            users.map(
                async (user) => {
                    let preClaimInfo = await getAccountStakeInfo(user)
                    let totalForUserAtFundBlock = await staking.totalStakedForAt(user, lastFundedBlock)
                    let tx = await delegateManager.claimRewards(user, { from: user })
                    let postClaimInfo = await getAccountStakeInfo(user)
                    let rewards = postClaimInfo.totalInStakingContract.sub(preClaimInfo.totalInStakingContract)
                    testLog(user, `Claimed ${rewards}, totalForUserAtFundBlock=${totalForUserAtFundBlock} - validBounds==${preClaimInfo.spDetails.validBounds}`)
                }
            )
        )
        sysLog(`------- Finished Claiming Rewards -------`)
        await randomlyAdvanceBlocks()
    }

    const initiateRound = async (user) => {
        sysLog(`------- Initiating Round -------`)
        let lastFundedBlock = await claimsManager.getLastFundedBlock()
        sysLog(`lastFundedBlock: ${lastFundedBlock.toString()}`)
        let fundingRoundDiff = await claimsManager.getFundingRoundBlockDiff()
        sysLog(`fundingRoundDiff: ${fundingRoundDiff.toString()}`)
        let nextFundingRoundBlock = lastFundedBlock.add(fundingRoundDiff)
        sysLog(`nextFundingRoundBlock: ${nextFundingRoundBlock.toString()}`)
        let latestBlock = await web3.eth.getBlock('latest')
        if (nextFundingRoundBlock.gte(_lib.toBN(latestBlock.number))) {
            try {
                await time.advanceBlockTo(nextFundingRoundBlock.add(_lib.toBN(1)))
            } catch(e) {
                sysLog(`Caught ${e} advancing blocks`)
            }
        }
        sysLog(`latestBlock: ${latestBlock.number.toString()}`)
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
            sysLog(`Randomly advancing ${numBlocks} blocks from ${latestBlockNumber} to ${targetBlockNumber}, ${shouldRandomlyAdvance}/100`)
            await time.advanceBlockTo(targetBlockNumber)
            latestBlock = await web3.eth.getBlock('latest')
            latestBlockNumber = _lib.toBN(latestBlock.number)
        } catch(e) {
            sysLog(e)
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
                    await randomlyDelegate(user)
                    await randomlyDecreaseStake(user)
                    // await randomlyUndelegate(user)
                }
                // Randomly advance blocks
                await randomlyAdvanceBlocks()
            })
        )
    }

    it('Random test suite', async () => {
        let startTime = Date.now()
        let duration = Date.now() - startTime
        await logCurrentBlock()
        while (duration < TestDuration) {
            sysLog(`------------------------ AUDIUS RANDOM TESTING - Round ${currentRound}, ${duration}/${TestDuration}ms ------------------------`)
            // Ensure base user state (service requirements satisfied)
            await processUserState(users)
            // TODO: Randomize from which acct the round is initiated
            await initiateRound(users[0])
            await claimPendingRewards(users)
            await validateUsers(users)
            sysLog(`------------------------ AUDIUS RANDOM TESTING - Finished Round ${currentRound} ------------------------\n`)
            // Progress round
            currentRound++
            // Update duration
            duration = Date.now() - startTime
            await logCurrentBlock()
        }
        await logCurrentBlock()
        sysLog(`------------------------ AUDIUS RANDOM TESTING SUMMARY - Finished ${currentRound} rounds in ${duration}ms ------------------------`)
        logTestSummary()
    })
})