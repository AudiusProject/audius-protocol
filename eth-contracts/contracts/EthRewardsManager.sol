pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "./InitializableV2.sol";
import "./Governance.sol";

interface Wormhole {
    function lockAssets(
        address asset,
        uint256 amount,
        bytes32 recipient,
        uint8 target_chain,
        uint32 nonce,
        bool refund_dust
    ) external;
}

contract EthRewardsManager is InitializableV2 {
    using SafeERC20 for ERC20;

    string private constant ERROR_TOKEN_NOT_CONTRACT =
        "EthRewardsManager: token is not a contract";
    string private constant ERROR_WORMHOLE_NOT_CONTRACT =
        "EthRewardsManager: wormhole is not a contract";
    string private constant ERROR_ONLY_GOVERNANCE =
        "EthRewardsManager: Only governance";

    address private governanceAddress;

    /// @dev ERC-20 token that will be used to stake with
    ERC20 internal audiusToken;
    Wormhole internal wormhole;
    bytes32 internal recipient;

    address public botOracle;

    /**
     * @notice Function to initialize the contract
     * @param _tokenAddress - address of ERC20 token
     * @param _governanceAddress - address for Governance proxy contract
     */
    function initialize(
        address _tokenAddress,
        address _governanceAddress,
        address _wormholeAddress,
        bytes32 _recipient
    ) public initializer {
        require(Address.isContract(_tokenAddress), ERROR_TOKEN_NOT_CONTRACT);
        require(
            Address.isContract(_wormholeAddress),
            ERROR_WORMHOLE_NOT_CONTRACT
        );
        audiusToken = ERC20(_tokenAddress);
        wormhole = Wormhole(_wormholeAddress);
        recipient = _recipient;
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
     * @notice Set the recipient address
     * @dev Only callable by Governance address
     * @param _recipient - address for new recipient
     */
    function setRecipient(bytes32 _recipient) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        recipient = _recipient;
    }

    /**
     * @notice Set the botOracle address
     * @dev Only callable by Governance address
     * @param _botOracle - address for new botOracle
     */
    function setBotOracle(address _botOracle) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);
        botOracle = _botOracle;
    }

    /* External functions */

    /**
     * @notice Transfers to solana
     * @param _nonce - nonce for wormhole
     */
    function transferToSolana(uint32 _nonce) external {
        _requireIsInitialized();

        require(msg.sender == governanceAddress, ERROR_ONLY_GOVERNANCE);

        uint256 balance = audiusToken.balanceOf(address(this));
        audiusToken.approve(address(wormhole), balance);

        wormhole.lockAssets(
            address(audiusToken),
            balance,
            recipient,
            1,
            _nonce,
            true
        );
    }

    /**
     * @notice Get the token used by the contract
     * @return The token used by the contract
     */
    function token() external view returns (address) {
        _requireIsInitialized();

        return address(audiusToken);
    }

    /// @notice Get the Governance address
    function getGovernanceAddress() external view returns (address) {
        _requireIsInitialized();

        return governanceAddress;
    }

    // ========================================= Internal Functions =========================================

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
}
