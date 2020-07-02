pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@aragon/court/contracts/lib/Checkpointing.sol";
import "@aragon/court/contracts/lib/os/Uint256Helpers.sol";
import "./InitializableV2.sol";
import "./Governance.sol";


contract Staking is InitializableV2 {
    using SafeMath for uint256;
    using Uint256Helpers for uint256;
    using Checkpointing for Checkpointing.History;
    using SafeERC20 for ERC20;

    string private constant ERROR_TOKEN_NOT_CONTRACT = "Staking: Staking token is not a contract";
    string private constant ERROR_AMOUNT_ZERO = "Staking: Zero amount not allowed";
    string private constant ERROR_ONLY_GOVERNANCE = "Staking: Only governance";
    string private constant ERROR_ONLY_DELEGATE_MANAGER = (
      "Staking: Only callable from DelegateManager"
    );
    string private constant ERROR_ONLY_SERVICE_PROVIDER_FACTORY = (
      "Staking: Only callable from ServiceProviderFactory"
    );

    address private governanceAddress;
    address private claimsManagerAddress;
    address private delegateManagerAddress;
    address private serviceProviderFactoryAddress;

    /// @dev stores the history of staking and claims for a given address
    struct Account {
        Checkpointing.History stakedHistory;
        Checkpointing.History claimHistory;
    }

    /// @dev ERC-20 token that will be used to stake with
    ERC20 internal stakingToken;

    /// @dev maps addresses to staking and claims history
    mapping (address => Account) internal accounts;

    /// @dev total staked tokens at a given block
    Checkpointing.History internal totalStakedHistory;

    event Staked(address indexed user, uint256 amount, uint256 total);
    event Unstaked(address indexed user, uint256 amount, uint256 total);
    event Slashed(address indexed user, uint256 amount, uint256 total);

    /**
     * @notice Function to initialize the contract
     * @dev claimsManagerAddress must be initialized separately after ClaimsManager contract is deployed
     * @dev delegateManagerAddress must be initialized separately after DelegateManager contract is deployed
     * @dev serviceProviderFactoryAddress must be initialized separately after ServiceProviderFactory contract is deployed
     * @param _tokenAddress - address of ERC20 token that will be staked
     * @param _governanceAddress - address for Governance proxy contract
     */
    function initialize(
        address _tokenAddress,
        address _governanceAddress
    ) public initializer
    {
        require(Address.isContract(_tokenAddress), ERROR_TOKEN_NOT_CONTRACT);
        stakingToken = ERC20(_tokenAddress);
        _updateGovernanceAddress(_governanceAddress);
        InitializableV2.initialize();
    }

    /**
     * @notice Set the Governance address
     * @dev Only callable by Governance address
     * @param _governanceAddress - address for new Governance contract
     */
    function setGovernanceAddress(address _governanceAddress) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        _updateGovernanceAddress(_governanceAddress);
    }

    /**
     * @notice Set the ClaimsManaager address
     * @dev Only callable by Governance address
     * @param _claimsManager - address for new ClaimsManaager contract
     */
    function setClaimsManagerAddress(address _claimsManager) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        claimsManagerAddress = _claimsManager;
    }

    /**
     * @notice Set the ServiceProviderFactory address
     * @dev Only callable by Governance address
     * @param _spFactory - address for new ServiceProviderFactory contract
     */
    function setServiceProviderFactoryAddress(address _spFactory) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        serviceProviderFactoryAddress = _spFactory;
    }

    /**
     * @notice Set the DelegateManager address
     * @dev Only callable by Governance address
     * @param _delegateManager - address for new DelegateManager contract
     */
    function setDelegateManagerAddress(address _delegateManager) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        delegateManagerAddress = _delegateManager;
    }

    /* External functions */

    /**
     * @notice Funds `_amount` of tokens from ClaimsManager to target account
     * @param _amount - amount of rewards to  add to stake
     * @param _stakerAccount - address of staker
     */
    function stakeRewards(uint256 _amount, address _stakerAccount) external {
        _requireIsInitialized();
        _requireClaimsManagerAddressIsSet();

        require(
            msg.sender == claimsManagerAddress,
            "Staking: Only callable from ClaimsManager"
        );
        _stakeFor(_stakerAccount, msg.sender, _amount);

        this.updateClaimHistory(_amount, _stakerAccount);
    }

    /**
     * @notice Update claim history by adding an event to the claim history
     * @param _amount - amount to add to claim history
     * @param _stakerAccount - address of staker
     */
    function updateClaimHistory(uint256 _amount, address _stakerAccount) external {
        _requireIsInitialized();
        _requireClaimsManagerAddressIsSet();

        require(
            msg.sender == claimsManagerAddress || msg.sender == address(this),
            "Staking: Only callable from ClaimsManager or Staking.sol"
        );

        // Update claim history even if no value claimed
        accounts[_stakerAccount].claimHistory.add(block.number.toUint64(), _amount);
    }

    /**
     * @notice Slashes `_amount` tokens from _slashAddress
     * @dev Callable from DelegateManager
     * @param _amount - Number of tokens slashed
     * @param _slashAddress - Address being slashed
     */
    function slash(
        uint256 _amount,
        address _slashAddress
    ) external
    {
        _requireIsInitialized();
        _requireDelegateManagerAddressIsSet();

        require(
            msg.sender == delegateManagerAddress,
            ERROR_ONLY_DELEGATE_MANAGER
        );

        // Burn slashed tokens from account
        _burnFor(_slashAddress, _amount);

        emit Slashed(
            _slashAddress,
            _amount,
            totalStakedFor(_slashAddress)
        );
    }

    /**
     * @notice Stakes `_amount` tokens, transferring them from _accountAddress, and assigns them to `_accountAddress`
     * @param _accountAddress - The final staker of the tokens
     * @param _amount - Number of tokens staked
     */
    function stakeFor(
        address _accountAddress,
        uint256 _amount
    ) external
    {
        _requireIsInitialized();
        _requireServiceProviderFactoryAddressIsSet();

        require(
            msg.sender == serviceProviderFactoryAddress,
            ERROR_ONLY_SERVICE_PROVIDER_FACTORY
        );
        _stakeFor(
            _accountAddress,
            _accountAddress,
            _amount
        );
    }

    /**
     * @notice Unstakes `_amount` tokens, returning them to the desired account.
     * @param _accountAddress - Account unstaked for, and token recipient
     * @param _amount - Number of tokens staked
     */
    function unstakeFor(
        address _accountAddress,
        uint256 _amount
    ) external
    {
        _requireIsInitialized();
        _requireServiceProviderFactoryAddressIsSet();

        require(
            msg.sender == serviceProviderFactoryAddress,
            ERROR_ONLY_SERVICE_PROVIDER_FACTORY
        );
        _unstakeFor(
            _accountAddress,
            _accountAddress,
            _amount
        );
    }

    /**
     * @notice Stakes `_amount` tokens, transferring them from `_delegatorAddress` to `_accountAddress`,
               only callable by DelegateManager
     * @param _accountAddress - The final staker of the tokens
     * @param _delegatorAddress - Address from which to transfer tokens
     * @param _amount - Number of tokens staked
     */
    function delegateStakeFor(
        address _accountAddress,
        address _delegatorAddress,
        uint256 _amount
    ) external {
        _requireIsInitialized();
        _requireDelegateManagerAddressIsSet();

        require(
            msg.sender == delegateManagerAddress,
            ERROR_ONLY_DELEGATE_MANAGER
        );
        _stakeFor(
            _accountAddress,
            _delegatorAddress,
            _amount);
    }

    /**
     * @notice Unstakes '_amount` tokens, transferring them from `_accountAddress` to `_delegatorAddress`,
               only callable by DelegateManager
     * @param _accountAddress - The staker of the tokens
     * @param _delegatorAddress - Address from which to transfer tokens
     * @param _amount - Number of tokens unstaked
     */
    function undelegateStakeFor(
        address _accountAddress,
        address _delegatorAddress,
        uint256 _amount
    ) external {
        _requireIsInitialized();
        _requireDelegateManagerAddressIsSet();

        require(
            msg.sender == delegateManagerAddress,
            ERROR_ONLY_DELEGATE_MANAGER
        );
        _unstakeFor(
            _accountAddress,
            _delegatorAddress,
            _amount);
    }

    /**
     * @notice Get the token used by the contract for staking and locking
     * @return The token used by the contract for staking and locking
     */
    function token() external view returns (address) {
        _requireIsInitialized();

        return address(stakingToken);
    }

    /**
     * @notice Check whether it supports history of stakes
     * @return Always true
     */
    function supportsHistory() external view returns (bool) {
        _requireIsInitialized();

        return true;
    }

    /**
     * @notice Get last time `_accountAddress` modified its staked balance
     * @param _accountAddress - Account requesting for
     * @return Last block number when account's balance was modified
     */
    function lastStakedFor(address _accountAddress) external view returns (uint256) {
        _requireIsInitialized();

        uint256 length = accounts[_accountAddress].stakedHistory.history.length;
        if (length > 0) {
            return uint256(accounts[_accountAddress].stakedHistory.history[length - 1].time);
        }
        return 0;
    }

    /**
     * @notice Get last time `_accountAddress` claimed a staking reward
     * @param _accountAddress - Account requesting for
     * @return Last block number when claim requested
     */
    function lastClaimedFor(address _accountAddress) external view returns (uint256) {
        _requireIsInitialized();

        uint256 length = accounts[_accountAddress].claimHistory.history.length;
        if (length > 0) {
            return uint256(accounts[_accountAddress].claimHistory.history[length - 1].time);
        }
        return 0;
    }

    /**
     * @notice Get the total amount of tokens staked by `_accountAddress` at block number `_blockNumber`
     * @param _accountAddress - Account requesting for
     * @param _blockNumber - Block number at which we are requesting
     * @return The amount of tokens staked by the account at the given block number
     */
    function totalStakedForAt(
        address _accountAddress,
        uint256 _blockNumber
    ) external view returns (uint256) {
        _requireIsInitialized();

        return accounts[_accountAddress].stakedHistory.get(_blockNumber.toUint64());
    }

    /**
     * @notice Get the total amount of tokens staked by all users at block number `_blockNumber`
     * @param _blockNumber - Block number at which we are requesting
     * @return The amount of tokens staked at the given block number
     */
    function totalStakedAt(uint256 _blockNumber) external view returns (uint256) {
        _requireIsInitialized();

        return totalStakedHistory.get(_blockNumber.toUint64());
    }

    /// @notice Get the Governance address
    function getGovernanceAddress() external view returns (address) {
        _requireIsInitialized();

        return governanceAddress;
    }

    /// @notice Get the ClaimsManager address
    function getClaimsManagerAddress() external view returns (address) {
        _requireIsInitialized();

        return claimsManagerAddress;
    }

    /// @notice Get the ServiceProviderFactory address
    function getServiceProviderFactoryAddress() external view returns (address) {
        _requireIsInitialized();

        return serviceProviderFactoryAddress;
    }

    /// @notice Get the DelegateManager address
    function getDelegateManagerAddress() external view returns (address) {
        _requireIsInitialized();

        return delegateManagerAddress;
    }

    /**
     * @notice Helper function wrapped around totalStakedFor. Checks whether _accountAddress
            is currently a valid staker with a non-zero stake
     * @param _accountAddress - Account requesting for
     * @return Boolean indicating whether account is a staker
     */
    function isStaker(address _accountAddress) external view returns (bool) {
        _requireIsInitialized();

        return totalStakedFor(_accountAddress) > 0;
    }

    /* Public functions */

    /**
     * @notice Get the amount of tokens staked by `_accountAddress`
     * @param _accountAddress - The owner of the tokens
     * @return The amount of tokens staked by the given account
     */
    function totalStakedFor(address _accountAddress) public view returns (uint256) {
        _requireIsInitialized();

        // we assume it's not possible to stake in the future
        return accounts[_accountAddress].stakedHistory.getLast();
    }

    /**
     * @notice Get the total amount of tokens staked by all users
     * @return The total amount of tokens staked by all users
     */
    function totalStaked() public view returns (uint256) {
        _requireIsInitialized();

        // we assume it's not possible to stake in the future
        return totalStakedHistory.getLast();
    }

    // ========================================= Internal Functions =========================================

    /**
     * @notice Adds stake from a transfer account to the stake account
     * @param _stakeAccount - Account that funds will be staked for
     * @param _transferAccount - Account that funds will be transferred from
     * @param _amount - amount to stake
     */
    function _stakeFor(
        address _stakeAccount,
        address _transferAccount,
        uint256 _amount
    ) internal
    {
        // staking 0 tokens is invalid
        require(_amount > 0, ERROR_AMOUNT_ZERO);

        // Checkpoint updated staking balance
        _modifyStakeBalance(_stakeAccount, _amount, true);

        // checkpoint total supply
        _modifyTotalStaked(_amount, true);

        // pull tokens into Staking contract
        stakingToken.safeTransferFrom(_transferAccount, address(this), _amount);

        emit Staked(
            _stakeAccount,
            _amount,
            totalStakedFor(_stakeAccount));
    }

    /**
     * @notice Unstakes tokens from a stake account to a transfer account
     * @param _stakeAccount - Account that staked funds will be transferred from
     * @param _transferAccount - Account that funds will be transferred to
     * @param _amount - amount to unstake
     */
    function _unstakeFor(
        address _stakeAccount,
        address _transferAccount,
        uint256 _amount
    ) internal
    {
        require(_amount > 0, ERROR_AMOUNT_ZERO);

        // checkpoint updated staking balance
        _modifyStakeBalance(_stakeAccount, _amount, false);

        // checkpoint total supply
        _modifyTotalStaked(_amount, false);

        // transfer tokens
        stakingToken.safeTransfer(_transferAccount, _amount);

        emit Unstaked(
            _stakeAccount,
            _amount,
            totalStakedFor(_stakeAccount)
        );
    }

    /**
     * @notice Burn tokens for a given staker
     * @dev Called when slash occurs
     * @param _stakeAccount - Account for which funds will be burned
     * @param _amount - amount to burn
     */
    function _burnFor(address _stakeAccount, uint256 _amount) internal {
        // burning zero tokens is not allowed
        require(_amount > 0, ERROR_AMOUNT_ZERO);

        // checkpoint updated staking balance
        _modifyStakeBalance(_stakeAccount, _amount, false);

        // checkpoint total supply
        _modifyTotalStaked(_amount, false);

        // burn
        ERC20Burnable(address(stakingToken)).burn(_amount);

        /** No event emitted since token.burn() call already emits a Transfer event */
    }

    /**
     * @notice Increase or decrease the staked balance for an account
     * @param _accountAddress - Account to modify
     * @param _by - amount to modify
     * @param _increase - true if increase in stake, false if decrease
     */
    function _modifyStakeBalance(address _accountAddress, uint256 _by, bool _increase) internal {
        uint256 currentInternalStake = accounts[_accountAddress].stakedHistory.getLast();

        uint256 newStake;
        if (_increase) {
            newStake = currentInternalStake.add(_by);
        } else {
            require(
                currentInternalStake >= _by,
                "Staking: Cannot decrease greater than current balance");
            newStake = currentInternalStake.sub(_by);
        }

        // add new value to account history
        accounts[_accountAddress].stakedHistory.add(block.number.toUint64(), newStake);
    }

    /**
     * @notice Increase or decrease the staked balance across all accounts
     * @param _by - amount to modify
     * @param _increase - true if increase in stake, false if decrease
     */
    function _modifyTotalStaked(uint256 _by, bool _increase) internal {
        uint256 currentStake = totalStaked();

        uint256 newStake;
        if (_increase) {
            newStake = currentStake.add(_by);
        } else {
            newStake = currentStake.sub(_by);
        }

        // add new value to total history
        totalStakedHistory.add(block.number.toUint64(), newStake);
    }

    /**
     * @notice Set the governance address after confirming contract identity
     * @param _governanceAddress - Incoming governance address
     */
    function _updateGovernanceAddress(address _governanceAddress) internal {
        require(
            Governance(_governanceAddress).isGovernanceAddress() == true,
            "Staking: _governanceAddress is not a valid governance contract"
        );
        governanceAddress = _governanceAddress;
    }

    // ========================================= Private Functions =========================================

    function _requireClaimsManagerAddressIsSet() private view {
        require(claimsManagerAddress != address(0x00), "Staking: claimsManagerAddress is not set");
    }

    function _requireDelegateManagerAddressIsSet() private view {
        require(
            delegateManagerAddress != address(0x00),
            "Staking: delegateManagerAddress is not set"
        );
    }

    function _requireServiceProviderFactoryAddressIsSet() private view {
        require(
            serviceProviderFactoryAddress != address(0x00),
            "Staking: serviceProviderFactoryAddress is not set"
        );
    }

}
