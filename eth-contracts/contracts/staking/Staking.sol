pragma solidity ^0.5.0;

import "./ERCStaking.sol";
import "./Checkpointing.sol";

import "./res/Autopetrified.sol";
import "./res/IsContract.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract Staking is Autopetrified, ERCStaking, ERCStakingHistory, IsContract {
    using SafeMath for uint256;
    using Checkpointing for Checkpointing.History;
    using SafeERC20 for ERC20;

    string private constant ERROR_TOKEN_NOT_CONTRACT = "STAKING_TOKEN_NOT_CONTRACT";
    string private constant ERROR_AMOUNT_ZERO = "STAKING_AMOUNT_ZERO";
    string private constant ERROR_TOKEN_TRANSFER = "STAKING_TOKEN_TRANSFER";
    string private constant ERROR_NOT_ENOUGH_BALANCE = "STAKING_NOT_ENOUGH_BALANCE";

    // standard - imitates relationship between Ether and Wei
    uint8 private constant DECIMALS = 18;

    // Reward tracking info
    uint256 internal currentClaimBlock;
    uint256 internal currentClaimableAmount;

    struct Account {
        Checkpointing.History stakedHistory;
        Checkpointing.History claimHistory;
    }

    // Multiplier used to increase funds
    Checkpointing.History stakeMultiplier;

    ERC20 internal stakingToken;
    mapping (address => Account) internal accounts;
    Checkpointing.History internal totalStakedHistory;
    address treasuryAddress;
    address stakingOwnerAddress;

    event StakeTransferred(
      address indexed from,
      uint256 amount,
      address to
    );

    event Claimed(
      address claimaint,
      uint256 amountClaimed
    );

    event Test(
      uint256 test,
      string msg);

    function initialize(address _stakingToken, address _treasuryAddress) external onlyInit {
        require(isContract(_stakingToken), ERROR_TOKEN_NOT_CONTRACT);
        initialized();
        stakingToken = ERC20(_stakingToken);
        treasuryAddress = _treasuryAddress;

        // Initialize claim values to zero, disabling claim prior to initial funding
        currentClaimBlock = 0;
        currentClaimableAmount = 0;

        uint256 initialMultiplier = 10**uint256(DECIMALS);
        // Initialize multiplier history value
        stakeMultiplier.add64(getBlockNumber64(), initialMultiplier);
    }

    /* External functions */

    /**
     * @notice Funds `_amount` of tokens from msg.sender into treasury stake
     */
    function fundNewClaim(uint256 _amount) external isInitialized {
        // TODO: Add additional require statements here...

        // Update multiplier, total stake
        uint256 currentMultiplier = stakeMultiplier.getLatestValue();
        uint256 totalStake = totalStakedHistory.getLatestValue();

        // Calculate and distribute funds by updating multiplier
        // Proportionally increases multiplier equivalent to incoming token value
        // newMultiplier = currentMultiplier + ((multiplier * _amount) / total) 
        // Ex:
        // multiplier = 1.0, total = 200,000, address1 = 200,000 * 1.0 (has all value)
        // Incoming claim fund of 100,000
        // newMultiplier = 1.0 + ((1.0 * 100,000) / 200,000) = 1.5
        // address1 = 200,000 * 1.5 = 300,000 <-- Total value increased by fundAmount, with newMultiplier
        uint256 multiplierDifference = (currentMultiplier.mul(_amount)).div(totalStake); 
        uint256 newMultiplier = currentMultiplier.add(multiplierDifference);
        stakeMultiplier.add64(getBlockNumber64(), newMultiplier);

        // pull tokens into Staking contract from caller
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Increase total supply by input amount
        _modifyTotalStaked(_amount, true);
    }

    /**
     * @notice Slashes `_amount` tokens from _slashAddress
     * Controlled by treasury address
     * @param _amount Number of tokens slashed
     * @param _slashAddress address being slashed
     */
    function slash(uint256 _amount, address _slashAddress) external isInitialized {
        // TODO: restrict functionality to delegate manager
        // require(msg.sender == treasuryAddress, "Slashing functionality locked to treasury owner");

        // unstaking 0 tokens is not allowed
        require(_amount > 0, ERROR_AMOUNT_ZERO);

        // Adjust amount by internal stake multiplier
        uint internalSlashAmount = _amount.div(stakeMultiplier.getLatestValue());

        // transfer slashed funds to treasury address
        // reduce stake balance for address being slashed
        _transfer(_slashAddress, treasuryAddress, internalSlashAmount);
    }

    /**
      * @notice Sets caller for stake and unstake functions
      * Controlled by treasury address
      */
    function setStakingOwnerAddress(address _stakeCaller) external isInitialized {
        require(msg.sender == treasuryAddress, "Slashing functionality locked to treasury owner");
        stakingOwnerAddress = _stakeCaller;
    }

    /**
     * @notice Stakes `_amount` tokens, transferring them from `msg.sender`
     * @param _amount Number of tokens staked
     * @param _data Used in Staked event, to add signalling information in more complex staking applications
     */
    function stake(uint256 _amount, bytes calldata _data) external isInitialized {
        require(msg.sender == stakingOwnerAddress, "Unauthorized staking operation");
        _stakeFor(
            msg.sender,
            msg.sender,
            _amount,
            _data);
    }

    /**
     * @notice Stakes `_amount` tokens, transferring them from caller, and assigns them to `_accountAddress`
     * @param _accountAddress The final staker of the tokens
     * @param _amount Number of tokens staked
     * @param _data Used in Staked event, to add signalling information in more complex staking applications
     */
    function stakeFor(address _accountAddress, uint256 _amount, bytes calldata _data) external isInitialized {
        // TODO: permission to contract addresses via registry contract instead of 'stakingOwnerAddress'  
        // require(msg.sender == stakingOwnerAddress, "Unauthorized staking operation");
        _stakeFor(
            _accountAddress,
            _accountAddress,
            _amount,
            _data);
    }

    /**
     * @notice Unstakes `_amount` tokens, returning them to the user
     * @param _amount Number of tokens staked
     * @param _data Used in Unstaked event, to add signalling information in more complex staking applications
     */
     // TODO: Convert to internal model w/transfer address and account address
    function unstake(uint256 _amount, bytes calldata _data) external isInitialized {
        _unstakeFor(
          msg.sender,
          msg.sender,
          _amount,
          _data);
    }

    /**
     * @notice Unstakes `_amount` tokens, returning them to the desired account.
     * @param _accountAddress Account unstaked for, and token recipient 
     * @param _amount Number of tokens staked
     * @param _data Used in Unstaked event, to add signalling information in more complex staking applications
     */
    function unstakeFor(address _accountAddress, uint256 _amount, bytes calldata _data) external isInitialized {
        // TODO: permission to contract addresses via registry contract instead of 'stakingOwnerAddress'  
        // require(msg.sender == stakingOwnerAddress, "Unauthorized staking operation");
        // unstaking 0 tokens is not allowed
        _unstakeFor(
          _accountAddress,
          _accountAddress,
          _amount,
          _data);
    }

    /**
     * @notice Stakes `_amount` tokens, transferring them from caller, and assigns them to `_accountAddress`
     * @param _accountAddress The final staker of the tokens
     * @param _delegatorAddress Address from which to transfer tokens
     * @param _amount Number of tokens staked
     * @param _data Used in Staked event, to add signalling information in more complex staking applications
     */
    function delegateStakeFor(
      address _accountAddress,
      address _delegatorAddress,
      uint256 _amount,
      bytes calldata _data
    ) external isInitialized {
        // TODO: permission to contract addresses via registry contract instead of 'stakingOwnerAddress'  
        // require(msg.sender == stakingOwnerAddress, "Unauthorized staking operation");
        _stakeFor(
            _accountAddress,
            _delegatorAddress,
            _amount,
            _data);
    }

    /**
     * @notice Stakes `_amount` tokens, transferring them from caller, and assigns them to `_accountAddress`
     * @param _accountAddress The staker of the tokens
     * @param _delegatorAddress Address from which to transfer tokens
     * @param _amount Number of tokens unstaked
     * @param _data Used in Staked event, to add signalling information in more complex staking applications
     */
    function undelegateStakeFor(
      address _accountAddress,
      address _delegatorAddress,
      uint256 _amount,
      bytes calldata _data
    ) external isInitialized {
        // TODO: permission to contract addresses via registry contract instead of 'stakingOwnerAddress'  
        // require(msg.sender == stakingOwnerAddress, "Unauthorized staking operation");
        _unstakeFor(
            _accountAddress,
            _delegatorAddress,
            _amount,
            _data);
    }

    /**
     * @notice Get the token used by the contract for staking and locking
     * @return The token used by the contract for staking and locking
     */
    function token() external view isInitialized returns (address) {
        return address(stakingToken);
    }

    /**
     * @notice Check whether it supports history of stakes
     * @return Always true
     */
    function supportsHistory() external pure returns (bool) {
        return true;
    }

    /**
     * @return Current stake multiplier
     */
    function getCurrentStakeMultiplier() public view isInitialized returns (uint256) {
      return stakeMultiplier.getLatestValue();
    }

    /**
     * @notice Get last time `_accountAddress` modified its staked balance
     * @param _accountAddress Account requesting for
     * @return Last block number when account's balance was modified
     */
    function lastStakedFor(address _accountAddress) external view isInitialized returns (uint256) {
        return accounts[_accountAddress].stakedHistory.lastUpdated();
    }

    /**
     * @notice Get last time `_accountAddress` claimed a staking reward
     * @param _accountAddress Account requesting for
     * @return Last block number when claim requested
     */
    function lastClaimedFor(address _accountAddress) external view isInitialized returns (uint256) {
        return accounts[_accountAddress].claimHistory.lastUpdated();
    }

    /**
     * @notice Get info relating to current claim status
     */
    function getClaimInfo() external view isInitialized returns (uint256, uint256) {
        return (currentClaimableAmount, currentClaimBlock);
    }

    /**
     * @notice Get the total amount of tokens staked by `_accountAddress` at block number `_blockNumber`
     * @param _accountAddress Account requesting for
     * @param _blockNumber Block number at which we are requesting
     * @return The amount of tokens staked by the account at the given block number
     */
    function totalStakedForAt(address _accountAddress, uint256 _blockNumber) external view returns (uint256) {
        return (accounts[_accountAddress].stakedHistory.get(_blockNumber)).mul(stakeMultiplier.get(_blockNumber));
    }

    /**
     * @notice Get the total amount of tokens staked by all users at block number `_blockNumber`
     * @param _blockNumber Block number at which we are requesting
     * @return The amount of tokens staked at the given block number
     */
    function totalStakedAt(uint256 _blockNumber) external view returns (uint256) {
        return totalStakedHistory.get(_blockNumber);
    }

    /* Public functions */

    /**
     * @notice Get the amount of tokens staked by `_accountAddress`
     * @param _accountAddress The owner of the tokens
     * @return The amount of tokens staked by the given account
     */
    function totalStakedFor(address _accountAddress) public view returns (uint256) {
        // we assume it's not possible to stake in the future
        return (accounts[_accountAddress].stakedHistory.getLatestValue()).mul(stakeMultiplier.getLatestValue());
    }

    /**
     * @notice Get the total amount of tokens staked by all users
     * @return The total amount of tokens staked by all users
     */
    function totalStaked() public view returns (uint256) {
        // we assume it's not possible to stake in the future
        return totalStakedHistory.getLatestValue();
    }

    /* Internal functions */

    function _stakeFor(
        address _stakeAccount,
        address _transferAccount,
        uint256 _amount,
        bytes memory _data) internal
    {
        // staking 0 tokens is invalid
        require(_amount > 0, ERROR_AMOUNT_ZERO);

        // Adjust amount by internal stake multiplier
        uint internalStakeAmount = _amount.div(stakeMultiplier.getLatestValue());

        // Checkpoint updated staking balance
        _modifyStakeBalance(_stakeAccount, internalStakeAmount, true);

        // checkpoint total supply
        _modifyTotalStaked(_amount, true);

        // pull tokens into Staking contract
        stakingToken.safeTransferFrom(_transferAccount, address(this), _amount);

        emit Staked(
            _stakeAccount,
            _amount,
            totalStakedFor(_stakeAccount),
            _data);
    }

    function _unstakeFor(
      address _stakeAccount,
      address _transferAccount,
      uint256 _amount,
      bytes memory _data) internal
    {
        require(_amount > 0, ERROR_AMOUNT_ZERO);
        // Adjust amount by internal stake multiplier
        uint internalStakeAmount = _amount.div(stakeMultiplier.getLatestValue());

        // checkpoint updated staking balance
        _modifyStakeBalance(_stakeAccount, internalStakeAmount, false);

        // checkpoint total supply
        _modifyTotalStaked(_amount, false);

        // transfer tokens
        stakingToken.safeTransfer(_transferAccount, _amount);

        emit Unstaked(
            _stakeAccount,
            _amount,
            totalStakedFor(_stakeAccount),
            _data);
    }

    // Note that _by value has been adjusted for the stake multiplier prior to getting passed in 
    function _modifyStakeBalance(address _accountAddress, uint256 _by, bool _increase) internal {
        // currentInternalStake represents the internal stake value, without multiplier adjustment
        uint256 currentInternalStake = accounts[_accountAddress].stakedHistory.getLatestValue();

        uint256 newStake;
        if (_increase) {
            newStake = currentInternalStake.add(_by);
        } else {
            require(
              currentInternalStake >= _by,
              'Cannot decrease greater than current balance');
            newStake = currentInternalStake.sub(_by);
        }

        // add new value to account history
        accounts[_accountAddress].stakedHistory.add64(getBlockNumber64(), newStake);
    }

    function _modifyTotalStaked(uint256 _by, bool _increase) internal {
        uint256 currentStake = totalStaked();

        uint256 newStake;
        if (_increase) {
            newStake = currentStake.add(_by);
        } else {
            newStake = currentStake.sub(_by);
        }

        // add new value to total history
        totalStakedHistory.add64(getBlockNumber64(), newStake);
    }

    function _transfer(address _from, address _to, uint256 _amount) internal {
        // transferring 0 staked tokens is invalid
        require(_amount > 0, ERROR_AMOUNT_ZERO);

        // update stakes
        _modifyStakeBalance(_from, _amount, false);
        _modifyStakeBalance(_to, _amount, true);

        emit StakeTransferred(_from,_amount, _to);
    }
}
