pragma solidity ^0.5.0;

import "./StakingInterface.sol";
import "../service/interface/registry/RegistryInterface.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@aragon/court/contracts/lib/Checkpointing.sol";
import "@aragon/court/contracts/lib/os/Uint256Helpers.sol";
import "../service/registry/RegistryContract.sol";


/** NOTE - will call RegistryContract.constructor, which calls Ownable constructor */
contract Staking is RegistryContract, StakingInterface {
    using SafeMath for uint256;
    using Uint256Helpers for uint256;
    using Checkpointing for Checkpointing.History;
    using SafeERC20 for ERC20;

    string private constant ERROR_TOKEN_NOT_CONTRACT = "STAKING_TOKEN_NOT_CONTRACT";
    string private constant ERROR_AMOUNT_ZERO = "STAKING_AMOUNT_ZERO";
    string private constant ERROR_TOKEN_TRANSFER = "STAKING_TOKEN_TRANSFER";
    string private constant ERROR_NOT_ENOUGH_BALANCE = "STAKING_NOT_ENOUGH_BALANCE";

    // Reward tracking info
    uint256 internal currentClaimBlock;

    // stores the history of staking and claim for a given address
    struct Account {
        Checkpointing.History stakedHistory;
        Checkpointing.History claimHistory;
    }

    // ERC-20 token that will be used to stake with
    ERC20 internal stakingToken;
    RegistryInterface registry = RegistryInterface(0);

    // maps addresses to staking and claims history
    mapping (address => Account) internal accounts;
    
    // total staked tokens at a given block
    Checkpointing.History internal totalStakedHistory;

    address registryAddress;
    bytes32 claimsManagerProxyKey;
    bytes32 delegateManagerKey;
    bytes32 serviceProviderFactoryKey;

    event Slashed(address indexed user, uint256 amount, uint256 total);

    function initialize(
        address _stakingToken,
        address _registryAddress,
        bytes32 _claimsManagerProxyKey,
        bytes32 _delegateManagerKey,
        bytes32 _serviceProviderFactoryKey
    ) public initializer
    {
        require(Address.isContract(_stakingToken), ERROR_TOKEN_NOT_CONTRACT);
        stakingToken = ERC20(_stakingToken);
        registry = RegistryInterface(_registryAddress);
        registryAddress = _registryAddress;
        claimsManagerProxyKey = _claimsManagerProxyKey;
        delegateManagerKey = _delegateManagerKey;
        serviceProviderFactoryKey = _serviceProviderFactoryKey;

        RegistryContract.initialize();
    }

    /* External functions */

    /**
     * @notice Funds `_amount` of tokens from ClaimsManager to target account
     */
    function stakeRewards(uint256 _amount, address _stakerAccount) external {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(claimsManagerProxyKey),
            "Only callable from ClaimsManager"
        );
        _stakeFor(_stakerAccount, msg.sender, _amount);

        // Update claim history even if no value claimed
        accounts[_stakerAccount].claimHistory.add(block.number.toUint64(), _amount);
    }

    /**
     * @notice Slashes `_amount` tokens from _slashAddress
     * Callable from DelegateManager
     * @param _amount Number of tokens slashed
     * @param _slashAddress address being slashed
     */
    function slash(
        uint256 _amount,
        address _slashAddress
    ) external
    {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(delegateManagerKey),
            "Only callable from DelegateManager"
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
     * @param _accountAddress The final staker of the tokens
     * @param _amount Number of tokens staked
     */
    function stakeFor(
        address _accountAddress,
        uint256 _amount
    ) external
    {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(serviceProviderFactoryKey),
            "Only callable from ServiceProviderFactory"
        );
        _stakeFor(
            _accountAddress,
            _accountAddress,
            _amount);
    }

    /**
     * @notice Unstakes `_amount` tokens, returning them to the desired account.
     * @param _accountAddress Account unstaked for, and token recipient
     * @param _amount Number of tokens staked
     */
    function unstakeFor(
        address _accountAddress,
        uint256 _amount
    ) external
    {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(serviceProviderFactoryKey),
            "Only callable from ServiceProviderFactory"
        );
        _unstakeFor(
            _accountAddress,
            _accountAddress,
            _amount
        );
    }

    /**
     * @notice Stakes `_amount` tokens, transferring them from caller, and assigns them to `_accountAddress`
     * @param _accountAddress The final staker of the tokens
     * @param _delegatorAddress Address from which to transfer tokens
     * @param _amount Number of tokens staked
     */
    function delegateStakeFor(
        address _accountAddress,
        address _delegatorAddress,
        uint256 _amount
    ) external {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(delegateManagerKey),
            "delegateStakeFor - Only callable from DelegateManager"
        );
        _stakeFor(
            _accountAddress,
            _delegatorAddress,
            _amount);
    }

    /**
     * @notice Stakes `_amount` tokens, transferring them from caller, and assigns them to `_accountAddress`
     * @param _accountAddress The staker of the tokens
     * @param _delegatorAddress Address from which to transfer tokens
     * @param _amount Number of tokens unstaked
     */
    function undelegateStakeFor(
        address _accountAddress,
        address _delegatorAddress,
        uint256 _amount
    ) external {
        _requireIsInitialized();
        require(
            msg.sender == registry.getContract(delegateManagerKey),
            "undelegateStakeFor - Only callable from DelegateManager"
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
     * @notice Get last time `_accountAddress` modified its staked balance
     * @param _accountAddress Account requesting for
     * @return Last block number when account's balance was modified
     */
    function lastStakedFor(address _accountAddress) external view returns (uint256) {
        uint256 length = accounts[_accountAddress].stakedHistory.history.length;
        if (length > 0) {
            return uint256(accounts[_accountAddress].stakedHistory.history[length - 1].time);
        }
        return 0;
    }

    /**
     * @notice Get last time `_accountAddress` claimed a staking reward
     * @param _accountAddress Account requesting for
     * @return Last block number when claim requested
     */
    function lastClaimedFor(address _accountAddress) external view returns (uint256) {
        uint256 length = accounts[_accountAddress].claimHistory.history.length;
        if (length > 0) {
            return uint256(accounts[_accountAddress].claimHistory.history[length - 1].time);
        }
        return 0;
    }

    /**
     * @notice Get the total amount of tokens staked by `_accountAddress` at block number `_blockNumber`
     * @param _accountAddress Account requesting for
     * @param _blockNumber Block number at which we are requesting
     * @return The amount of tokens staked by the account at the given block number
     */
    function totalStakedForAt(
        address _accountAddress,
        uint256 _blockNumber
    ) external view returns (uint256) {
        return accounts[_accountAddress].stakedHistory.get(_blockNumber.toUint64());
    }

    /**
     * @notice Get the total amount of tokens staked by all users at block number `_blockNumber`
     * @param _blockNumber Block number at which we are requesting
     * @return The amount of tokens staked at the given block number
     */
    function totalStakedAt(uint256 _blockNumber) external view returns (uint256) {
        return totalStakedHistory.get(_blockNumber.toUint64());
    }

    /* Public functions */

    /**
     * @notice Get the amount of tokens staked by `_accountAddress`
     * @param _accountAddress The owner of the tokens
     * @return The amount of tokens staked by the given account
     */
    function totalStakedFor(address _accountAddress) public view returns (uint256) {
        // we assume it's not possible to stake in the future
        return accounts[_accountAddress].stakedHistory.getLast();
    }

    /**
     * @notice Get the total amount of tokens staked by all users
     * @return The total amount of tokens staked by all users
     */
    function totalStaked() public view returns (uint256) {
        // we assume it's not possible to stake in the future
        return totalStakedHistory.getLast();
    }

    /* Internal functions */

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

    function _modifyStakeBalance(address _accountAddress, uint256 _by, bool _increase) internal {
        uint256 currentInternalStake = accounts[_accountAddress].stakedHistory.getLast();

        uint256 newStake;
        if (_increase) {
            newStake = currentInternalStake.add(_by);
        } else {
            require(
                currentInternalStake >= _by,
                "Cannot decrease greater than current balance");
            newStake = currentInternalStake.sub(_by);
        }

        // add new value to account history
        accounts[_accountAddress].stakedHistory.add(block.number.toUint64(), newStake);
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
        totalStakedHistory.add(block.number.toUint64(), newStake);
    }
}
