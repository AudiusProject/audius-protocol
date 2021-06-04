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

    // for ERC20 approve transactions in compliance with EIP 2612:
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2612.md
    // code below, in constructor, and in permit function adapted from the audited reference Uniswap implementation:
    // https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2ERC20.sol
    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("LockAssets(address from,uint256 amount,bytes32 recipient,uint8 targetChain,uint32 nonce,bool refundDust,uint256 deadline)");

    bytes32 public constant LOCK_ASSETS_TYPEHASH = (
        0x32b9fa85e7487cf8e3430f4b773c7a862349025263595634cc74cb3036b9b130
    );

    mapping(address => uint32) public nonces;

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

        // EIP712-compatible signature data
        uint chainId;
        // solium-disable security/no-inline-assembly
        assembly {
            chainId := chainid
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("AudiusWormholeClient")),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    /**
     * @notice transfer `_amount` of tokens from sender to target account
     * @param from - account to transfer from
     * @param amount - amount of token to transfer
     * @param recipient - foreign chain address of recipient
     * @param targetChain -  id of the chain to transfer to
     * @param refundDust - bool to refund dust
     */
    function lockAssets(
        address from,
        uint256 amount,
        bytes32 recipient,
        uint8 targetChain,
        bool refundDust,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        uint32 nonce = nonces[from]++;

        // solium-disable security/no-block-members
        require(deadline >= block.timestamp, "AudiusToken: Deadline has expired");
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        LOCK_ASSETS_TYPEHASH,
                        from,
                        amount,
                        recipient,
                        targetChain,
                        nonce,
                        refundDust,
                        deadline
                    )
                )
            )
        );

        address recoveredAddress = ecrecover(digest, v, r, s);
        require(
            recoveredAddress != address(0) && recoveredAddress == from,
            "AudiusToken: Invalid signature"
        );

        transferToken.safeTransferFrom(from, address(this), amount);
        transferToken.approve(address(wormhole), amount);

        wormhole.lockAssets(
            address(transferToken),
            amount,
            recipient,
            targetChain,
            nonce,
            refundDust
        );
    }
}
