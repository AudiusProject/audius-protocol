pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "./InitializableV2.sol";

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


contract WormholeClient is InitializableV2 {
    using SafeERC20 for ERC20;

    string private constant ERROR_TOKEN_NOT_CONTRACT = (
        "WormholeClient: Transfer token is not a contract"
    );
    string private constant ERROR_WORMHOLE_NOT_CONTRACT = (
        "WormholeClient: Wormhole is not a contract"
    );

    /// @dev ERC-20 token that will be transfered
    ERC20 internal transferToken;
    Wormhole internal wormhole;

    /**
     * @notice Get the token used by the contract for transfer
     * @return The token used by the contract for transfer
     */
    function token() external view returns (address) {
        _requireIsInitialized();

        return address(transferToken);
    }

    /**
     * @notice Function to initialize the contract
     * @param _tokenAddress - address of ERC20 token that will be transfered
     * @param _wormholeAddress - address for Wormhole proxy contract
     */
    function initialize(address _tokenAddress, address _wormholeAddress)
        public
        initializer
    {
        require(Address.isContract(_tokenAddress), ERROR_TOKEN_NOT_CONTRACT);
        require(
            Address.isContract(_wormholeAddress),
            ERROR_WORMHOLE_NOT_CONTRACT
        );
        transferToken = ERC20(_tokenAddress);
        wormhole = Wormhole(_wormholeAddress);
        InitializableV2.initialize();
    }

    /**
     * @notice transfer `_amount` of tokens from sender to target account
     * @param _amount - amount of token to transfer
     * @param _recipient - foreign chain address of recipient
     * @param _targetChain -  id of the chain to transfer to
     * @param _nonce - nonce
     * @param _refundDust - bool to refund dust
     */
    function lockAssets(
        uint256 _amount,
        bytes32 _recipient,
        uint8 _targetChain,
        uint32 _nonce,
        bool _refundDust
    ) public {
        transferToken.safeTransferFrom(msg.sender, address(this), _amount);

        wormhole.lockAssets(
            address(transferToken),
            _amount,
            _recipient,
            _targetChain,
            _nonce,
            _refundDust
        );
    }
}
