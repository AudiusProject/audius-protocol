pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "./InitializableV2.sol";
import "./IWormhole.sol";


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
    // keccak256("TransferTokens(address from,uint256 amount,uint16 recipientChain,bytes32 recipient,uint256 artbiterFee,uint32 nonce,uint256 deadline)");

    bytes32 public constant TRANSFER_TOKENS_TYPEHASH = (
        0xb5c18197d4070033d8a764555784c9c515ef8c35627dac4a9520d96403df3b35
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
     * @param recipientChain -  id of the chain to transfer to
     * @param recipient - foreign chain address of recipient
     * @param arbiterFee - the amount to pay the arbiter
     */
    function transferTokens(
        address from,
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient,
        uint256 arbiterFee,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        uint32 nonce = nonces[from]++;

        // solium-disable security/no-block-members
        require(deadline >= block.timestamp, "WormholeClient: Deadline has expired");
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        TRANSFER_TOKENS_TYPEHASH,
                        from,
                        amount,
                        recipientChain,
                        recipient,
			            arbiterFee,
                        nonce,
                        deadline
                    )
                )
            )
        );

        address recoveredAddress = ecrecover(digest, v, r, s);
        require(
            recoveredAddress != address(0) && recoveredAddress == from,
            "WormholeClient: Invalid signature"
        );

        transferToken.safeTransferFrom(from, address(this), amount);
        transferToken.approve(address(wormhole), amount);

        wormhole.transferTokens(
            address(transferToken),
            amount,
            recipientChain,
            recipient,
	        arbiterFee,
            nonce
        );
    }
}
	