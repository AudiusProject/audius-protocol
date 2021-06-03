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

    bytes32 public DOMAIN_SEPARATOR;

    bytes32 public constant LOCK_ASSETS_TYPEHASH = (
        0xc0d6f892604bee2cd37d2b5f77e4618e99d3c95eb3ff34d2d22388bf23c28bad
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

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("wormholeclient")),
                keccak256(bytes("1")),
                1,
                address(this)
            )
        );
    }

    /**
     * @notice transfer `_amount` of tokens from sender to target account
     * @param _from - account to transfer from
     * @param _amount - amount of token to transfer
     * @param _recipient - foreign chain address of recipient
     * @param _targetChain -  id of the chain to transfer to
     * @param _nonce - nonce
     * @param _refundDust - bool to refund dust
     */
    function lockAssets(
        address _from,
        uint256 _amount,
        bytes32 _recipient,
        uint8 _targetChain,
        uint32 _nonce,
        bool _refundDust,
        uint _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        transferToken.safeTransferFrom(_from, address(this), _amount);
        transferToken.approve(address(wormhole), _amount);

        // solium-disable security/no-block-members
        require(_deadline >= block.timestamp, "AudiusToken: Deadline has expired");
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        LOCK_ASSETS_TYPEHASH,
                        _from,
                        _amount,
                        _recipient,
                        _targetChain,
                        _nonce,
                        _refundDust,
                        _deadline
                    )
                )
            )
        );
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(
            recoveredAddress != address(0) && recoveredAddress == _from,
            "AudiusToken: Invalid signature"
        );

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
