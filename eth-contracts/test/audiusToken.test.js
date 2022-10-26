import * as _lib from '../utils/lib.js'
import * as _signatures from '../utils/signatures.js'

const tokenRegKey = web3.utils.utf8ToHex('Token')

contract('AudiusToken', async (accounts) => {
  let registry, token, governance

  // expected initial token values
  const NAME = "Audius"
  const SYMBOL = "AUDIO"
  const DECIMALS = 18  // standard - imitates relationship between Ether and Wei
  const INITIAL_SUPPLY = Math.pow(10,27) // 10^27 = 1 billion tokens, 18 decimal places

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress

  const votingPeriod = 10
  const executionDelay = votingPeriod
  const votingQuorumPercent = 10
  
  const callValue0 = _lib.toBN(0)

  beforeEach(async () => {
    registry = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)
    governance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      votingPeriod,
      executionDelay,
      votingQuorumPercent,
      guardianAddress
    )

    token = await _lib.deployToken(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      tokenOwnerAddress,
      governance.address
    )

    // Register token
    await registry.addContract(tokenRegKey, token.address, { from: proxyDeployerAddress })
  })

  it('Initial token properties + account balances', async () => {
    assert.equal(await token.name(), NAME)
    assert.equal(await token.symbol(), SYMBOL)
    assert.equal(await token.decimals(), DECIMALS)
    assert.equal(await token.totalSupply(), INITIAL_SUPPLY)

    assert.equal(await token.balanceOf(tokenOwnerAddress), INITIAL_SUPPLY)
    assert.equal(await token.balanceOf(accounts[11]), 0)
  })

  it('Transfers', async () => {
    const amount = 1000
    // transfer
    await token.transfer(accounts[11], amount, {from: tokenOwnerAddress})
    assert.equal(await token.balanceOf(tokenOwnerAddress), INITIAL_SUPPLY - amount)
    assert.equal(await token.balanceOf(accounts[11]), amount)

    // fail to transfer above balance
    await _lib.assertRevert(
      token.transfer(accounts[12], 2*amount, {from: accounts[11]}),
      'transfer amount exceeds balance' 
    )
  })

  it('Burn from tokenOwner', async () => {
    const burnAmount = Math.pow(10,3)

    // Confirm token state before burn
    assert.equal(await token.balanceOf(tokenOwnerAddress), INITIAL_SUPPLY)
    assert.equal(await token.totalSupply(), INITIAL_SUPPLY)

    // Decrease total supply by burning from tokenOwner
    await token.burn(burnAmount, { from: tokenOwnerAddress })

    // Confirm token state after burn
    assert.equal(await token.balanceOf(tokenOwnerAddress), INITIAL_SUPPLY - burnAmount)
    assert.equal(await token.totalSupply(), INITIAL_SUPPLY - burnAmount)
  })

  it('Burn from account', async () => {
    const amount = Math.pow(10,3)
    const account = accounts[11]

    // Confirm token state before burn
    await token.transfer(account, amount, {from: tokenOwnerAddress})
    assert.equal(await token.balanceOf(tokenOwnerAddress), INITIAL_SUPPLY - amount)
    assert.equal(await token.balanceOf(account), amount)
    assert.equal(await token.totalSupply(), INITIAL_SUPPLY)

    // Decrease total supply by burning from account
    await token.approve(tokenOwnerAddress, amount, { from: account })
    await token.burnFrom(account, amount, { from: tokenOwnerAddress })

    // Confirm token state after burn
    assert.equal(await token.balanceOf(tokenOwnerAddress), INITIAL_SUPPLY - amount)
    assert.equal(await token.balanceOf(account), 0)
    assert.equal(await token.totalSupply(), INITIAL_SUPPLY - amount)
  })

  it('Mint', async () => {
    // Confirm that only governance has minterRole
    assert.isTrue(await token.isMinter.call(governance.address))
    assert.isFalse(await token.isMinter.call(tokenOwnerAddress))

    // Confirm that mint from tokenOwnerAddress fails
    await _lib.assertRevert(
      token.mint(accounts[11], 1000, { from: tokenOwnerAddress }),
      "MinterRole: caller does not have the Minter role"
    )

    // mint tokens from governance
    await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'mint(address,uint256)',
      _lib.abiEncode(['address', 'uint256'], [accounts[11], 1000]),
      { from: guardianAddress }
    )

    // Confirm state after mint
    assert.equal(await token.balanceOf(tokenOwnerAddress), INITIAL_SUPPLY)
    assert.equal(await token.balanceOf(accounts[11]), 1000)
    assert.equal(await token.totalSupply(), INITIAL_SUPPLY + 1000)

    // Confirm that addMinter from tokenOwnerAddress fails
    await _lib.assertRevert(
      token.addMinter(accounts[12], { from: tokenOwnerAddress }),
      "MinterRole: caller does not have the Minter role"
    )

    // add new minter from governance
    await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'addMinter(address)',
      _lib.abiEncode(['address'], [accounts[12]]),
      { from: guardianAddress }
    )

    // Confirm minter state
    assert.isTrue(await token.isMinter(accounts[12]))
    assert.isTrue(await token.isMinter(governance.address))
    assert.isFalse(await token.isMinter(accounts[3]))

    // Confirm that new minter can mint
    await token.mint(accounts[12], 1000, {from: accounts[12]})

    // renounce minter
    await token.renounceMinter({from: accounts[12] })

    // fail to mint from renounced minter
    await _lib.assertRevert(
      token.mint(accounts[4], 1000, { from: accounts[12] }),
      "MinterRole: caller does not have the Minter role"
    )
  })

  it('Pause', async () => {
    // confirm that only governance has pauserRole
    assert.isTrue(await token.isPauser.call(governance.address))
    assert.isFalse(await token.isPauser.call(tokenOwnerAddress))

    // Confirm that pause from tokenOwnerAddress fails
    await _lib.assertRevert(
      token.pause({ from: tokenOwnerAddress }),
      "PauserRole: caller does not have the Pauser role"
    )

    // Pause token contract from governance
    await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'pause()',
      _lib.abiEncode([], []),
      { from: guardianAddress }
    )

    // Confirm state after pause
    assert.isTrue(await token.paused.call())

    // Confirm that token actions fail while paused
    await _lib.assertRevert(
      token.transfer(accounts[11], 1000, {from: tokenOwnerAddress}),
      "Pausable: paused"
    )

    // Add new pauser from governance
    const newPauser = accounts[5]
      await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'addPauser(address)',
      _lib.abiEncode(['address'], [newPauser]),
      { from: guardianAddress }
    )

    // Confirm pauser state
    assert.isFalse(await token.isPauser(tokenOwnerAddress))
    assert.isTrue(await token.isPauser.call(governance.address))
    assert.isTrue(await token.isPauser(newPauser))

    // Unpause contract from new pauser
    await token.unpause({from: newPauser})
    assert.isFalse(await token.paused())

    // fail to pause contract from non-pauser
    await _lib.assertRevert(
      token.pause({from: accounts[8]}),
      "PauserRole: caller does not have the Pauser role"
    )

    // Renounce pauser from new pauser
    await token.renouncePauser({from: newPauser})
    assert.isFalse(await token.isPauser(newPauser))
    assert.isTrue(await token.isPauser(governance.address))

    // fail to pause contract from renounced pauser
    await _lib.assertRevert(
      token.pause({ from: newPauser }),
      "PauserRole: caller does not have the Pauser role"
    )
  })

  it('Confirm token reinitialization fails', async () => {
    await _lib.assertRevert(
      token.initialize(proxyDeployerAddress, accounts[13]),
      'Contract instance has already been initialized'
    )
  })

  describe('EIP-2612', async function () {
    it('Confirm typehashes match for permit function', async () => {
      const chainId = 1  // in ganache, the chain ID the token initializes with is always 1
      expect(await token.DOMAIN_SEPARATOR()).to.equal(_signatures.getDomainSeparator(await token.name(), token.address, chainId))
      expect(await token.PERMIT_TYPEHASH()).to.equal(_signatures.PERMIT_TYPEHASH)
    })
  
    it('Successfully permit & transfer', async function () {
      const amount = 100
  
      // throwaway address for the purpose of this test
      const approverAcctPrivKey = Buffer.from('76195632b07afded1ae36f68635b6ff86791bd4579a27ca28ec7e539fed65c0e', 'hex')
      const approverAcct = '0xaaa30A4bB636F15be970f571BcBe502005E9D66b'

      const relayerAcct = accounts[6] // account that calls permit
      const spenderAcct = accounts[17] // account that submits tx and pays gas on approver's behalf
      const receiverAcct = accounts[14] // account that receives approver's tokens

      const name = await token.name()
      const chainId = 1  // in ganache, the chain ID the token initializes with is always 1
  
      // fund throwaway address and confirm balances of secondary addresses, and confirm allowances
      await token.transfer(approverAcct, amount, {from: tokenOwnerAddress})
      assert.equal(await token.balanceOf(approverAcct), amount)
      assert.equal(await token.balanceOf(receiverAcct), 0)
      assert.equal(await token.balanceOf(spenderAcct), 0)
      assert.equal((await token.allowance(approverAcct, spenderAcct)).toNumber(), 0)
  
      // Submit permit request to give address approval, via relayer
      let nonce = (await token.nonces(approverAcct)).toNumber()
      let deadline = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp + 25  // sufficiently far in future
      let digest = _signatures.getPermitDigest(name, token.address, chainId, {owner: approverAcct, spender: spenderAcct, value: amount}, nonce, deadline)
      let result = _signatures.sign(digest, approverAcctPrivKey)
      await token.permit(approverAcct, spenderAcct, amount, deadline, result.v, result.r, result.s, {from: relayerAcct})
  
      // Confirm allowance updated, but token balances have not changed
      assert.equal((await token.allowance(approverAcct, spenderAcct)).toNumber(), amount)
      assert.equal(await token.balanceOf(approverAcct), amount)
      assert.equal(await token.balanceOf(receiverAcct), 0)
      assert.equal(await token.balanceOf(spenderAcct), 0)

      // Transfer tokens from approved sender + confirm balances & allowances
      await token.transferFrom(approverAcct, receiverAcct, amount, {from: spenderAcct})
      assert.equal(await token.balanceOf(approverAcct), 0)
      assert.equal(await token.balanceOf(receiverAcct), amount)
      assert.equal(await token.balanceOf(spenderAcct), 0)
      assert.equal((await token.allowance(approverAcct, spenderAcct)).toNumber(), 0)
    })

    it('Meta-transaction approve extended test', async () => {
      const amount = 100
  
      // throwaway address for the purpose of this test
      const approverAcctPrivKey = Buffer.from('76195632b07afded1ae36f68635b6ff86791bd4579a27ca28ec7e539fed65c0e', 'hex')
      const approverAcct = '0xaaa30A4bB636F15be970f571BcBe502005E9D66b'

      const relayerAcct = accounts[6] // account that calls permit
      const spenderAcct = accounts[17] // account that submits tx and pays gas on approver's behalf
      const receiverAcct = accounts[14] // account that receives approver's tokens

      const name = await token.name()
      const chainId = 1  // in ganache, the chain ID the token initializes with is always 1
  
      // fund throwaway address and confirm balances of secondary addresses, and confirm allowances
      await token.transfer(approverAcct, amount, {from: tokenOwnerAddress})
      assert.equal(await token.balanceOf(approverAcct), amount)
      assert.equal(await token.balanceOf(receiverAcct), 0)
      assert.equal(await token.balanceOf(spenderAcct), 0)
      assert.equal((await token.allowance(approverAcct, spenderAcct)).toNumber(), 0)
  
      // Submit permit request to give address approval, via relayer
      let nonce = (await token.nonces(approverAcct)).toNumber()
      let deadline = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp + 25  // sufficiently far in future
      let digest = _signatures.getPermitDigest(name, token.address, chainId, {owner: approverAcct, spender: spenderAcct, value: amount}, nonce, deadline)
      let result = _signatures.sign(digest, approverAcctPrivKey)
      await token.permit(approverAcct, spenderAcct, amount, deadline, result.v, result.r, result.s, {from: relayerAcct})
  
      // Confirm allowance updated, but token balances have not changed
      assert.equal((await token.allowance(approverAcct, spenderAcct)).toNumber(), amount)
      assert.equal(await token.balanceOf(approverAcct), amount)
      assert.equal(await token.balanceOf(receiverAcct), 0)
      assert.equal(await token.balanceOf(spenderAcct), 0)

      // Confirm double-spend of same permit will fail
      await _lib.assertRevert(
        token.permit(approverAcct, spenderAcct, amount, deadline, result.v, result.r, result.s, {from: relayerAcct}),
        'AudiusToken: Invalid signature'
      )

      // Submit updated permit request, with different amount - confirm success
      const permitAmount = amount / 2
      nonce = (await token.nonces(approverAcct)).toNumber()
      deadline = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp + 25  // sufficiently far in future
      digest = _signatures.getPermitDigest(name, token.address, chainId, {owner: approverAcct, spender: spenderAcct, value: permitAmount}, nonce, deadline)
      result = _signatures.sign(digest, approverAcctPrivKey)
      await token.permit(approverAcct, spenderAcct, permitAmount, deadline, result.v, result.r, result.s, {from: relayerAcct})

      // Confirm allowance updated to new permit amount
      assert.equal((await token.allowance(approverAcct, spenderAcct)).toNumber(), permitAmount)
  
      // Transfer tokens from approved sender + confirm balances & allowances
      await token.transferFrom(approverAcct, receiverAcct, permitAmount, {from: spenderAcct})
      assert.equal(await token.balanceOf(approverAcct), amount - permitAmount)
      assert.equal(await token.balanceOf(receiverAcct), permitAmount)
      assert.equal(await token.balanceOf(spenderAcct), 0)
      assert.equal((await token.allowance(approverAcct, spenderAcct)).toNumber(), 0)
    })
  
    it('Meta-transaction nonce incorrect', async() => {
      const amount = 100
  
      // throwaway address for the purpose of this test
      const approverPrivKey = Buffer.from('76195632b07afded1ae36f68635b6ff86791bd4579a27ca28ec7e539fed65c0e', 'hex')
      const approverPubKey = '0xaaa30A4bB636F15be970f571BcBe502005E9D66b'
  
      const name = await token.name()
      const nonce = await token.nonces(approverPubKey) + 5  // this is wrong
      const chainId = 1  // in ganache, the chain ID the token initializes with is always 1
      const deadline = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp + 25  // sufficiently far in future
      const digest = _signatures.getPermitDigest(name, token.address, chainId, {owner: approverPubKey, spender: accounts[18], value: amount}, nonce, deadline)
      const result = _signatures.sign(digest, approverPrivKey)
      await _lib.assertRevert(token.permit(approverPubKey, accounts[18], amount, deadline, result.v, result.r, result.s, {from: accounts[6]}), "Invalid signature")
    })
  
    it('Meta-transaction deadline has passed', async() => {
      const amount = 100
  
      // throwaway address for the purpose of this test
      const approverPrivKey = Buffer.from('76195632b07afded1ae36f68635b6ff86791bd4579a27ca28ec7e539fed65c0e', 'hex')
      const approverPubKey = '0xaaa30A4bB636F15be970f571BcBe502005E9D66b'
  
      const name = await token.name()
      const nonce = await token.nonces(approverPubKey)
      const chainId = 1  // in ganache, the chain ID the token initializes with is always 1
      const deadline = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp - 25  // now in the past and should fail
      const digest = _signatures.getPermitDigest(name, token.address, chainId, {owner: approverPubKey, spender: accounts[18], value: amount}, nonce, deadline)
      const result = _signatures.sign(digest, approverPrivKey)
      await _lib.assertRevert(token.permit(approverPubKey, accounts[18], amount, deadline, result.v, result.r, result.s, {from: accounts[6]}), "Deadline has expired")
    })
  })  
})
