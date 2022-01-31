pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./Governance.sol";
import "./InitializableV2.sol";


contract TrustedNotifierManager is InitializableV2 {
    using SafeMath for uint256;

    address governanceAddress;

    uint256 private latestID;

    struct TrustedNotifier {
        address wallet;
        string endpoint;
    }

    mapping(uint256 => TrustedNotifier) IDToTrustedNotifierMap;

    mapping(address => uint256) walletToIDMap;

    mapping(bytes32 => uint256) endpointToIDMap;

    /**
     * @notice Function to initialize the contract
     * @param _governanceAddress - Governance proxy address
     */
    function initialize (address _governanceAddress) public initializer {
        _updateGovernanceAddress(_governanceAddress);
        InitializableV2.initialize();
    }

    function registerNotifier(
        address _wallet, string calldata _endpoint
    ) external returns (uint256) {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            "TrustedNotifierManager: Only callable by Governance contract."
        );

        // Ensure wallet isn't already registered
        require(
            walletToIDMap[_wallet] == 0,
            "TrustedNotifierManager: Wallet already registered."
        );

        // Ensure endpoint isn't already registered
        require(
            endpointToIDMap[keccak256(bytes(_endpoint))] == 0,
            "TrustedNotifierManager: Endpoint already registered."
        );

        uint256 ID = latestID.add(1);
        latestID = ID;

        IDToTrustedNotifierMap[ID] = TrustedNotifier({
            wallet: _wallet,
            endpoint: _endpoint
        });

        walletToIDMap[_wallet] = ID;

        endpointToIDMap[keccak256(bytes(_endpoint))] = ID;

        return ID;
    }

    function deregisterNotifier(address _wallet) external returns (uint256) {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress || msg.sender == _wallet,
            "TrustedNotifierManager: Only callable by Governance contract or _wallet."
        );

        uint256 ID = walletToIDMap[_wallet];
        TrustedNotifier memory notifier = IDToTrustedNotifierMap[ID];

        delete IDToTrustedNotifierMap[ID];
        delete walletToIDMap[_wallet];
        delete endpointToIDMap[keccak256(bytes(notifier.endpoint))];

        return ID;
    }

    function getLatestNotifierID() external view returns (uint256) {
        return latestID;
    }

    function getNotifierForID(uint256 _ID) external view returns (address wallet, string memory endpoint) {
        TrustedNotifier memory notifier = IDToTrustedNotifierMap[_ID];
        return (notifier.wallet, notifier.endpoint);
    }

    function getEndpointForWallet(address _wallet) external view returns (string memory) {
        uint256 ID = walletToIDMap[_wallet];
        TrustedNotifier memory notifier = IDToTrustedNotifierMap[ID];
        return notifier.endpoint;
    }

    function getWalletForEndpoint(string calldata _endpoint) external view returns (address) {
        uint256 ID = endpointToIDMap[keccak256(bytes(_endpoint))];
        TrustedNotifier memory notifier = IDToTrustedNotifierMap[ID];
        return notifier.wallet;
    }

    /// @notice Get the Governance address
    function getGovernanceAddress() external view returns (address) {
        _requireIsInitialized();

        return governanceAddress;
    }

    /**
     * @notice Set the Governance address
     * @dev Only callable by Governance address
     * @param _governanceAddress - address for new Governance contract
     */
    function setGovernanceAddress(address _governanceAddress) external {
        _requireIsInitialized();

        require(
            msg.sender == governanceAddress,
            "TrustedNotifierManager: Only callable by Governance contract"
        );
        _updateGovernanceAddress(_governanceAddress);
    }

    // ========================================= Internal Functions =========================================

    /**
     * @notice Set the governance address after confirming contract identity
     * @param _governanceAddress - Incoming governance address
     */
    function _updateGovernanceAddress(address _governanceAddress) internal {
        require(
            Governance(_governanceAddress).isGovernanceAddress() == true,
            "ServiceTypeManager: _governanceAddress is not a valid governance contract"
        );
        governanceAddress = _governanceAddress;
    }
}