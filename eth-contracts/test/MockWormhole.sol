pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";


contract MockWormhole {
    uint8 CHAIN_ID = 2;

    event LogTokensLocked(
        uint8 targetChain,
        uint8 tokenChain,
        uint8 tokenDecimals,
        bytes32 indexed token,
        bytes32 indexed sender,
        bytes32 recipient,
        uint256 amount,
        uint32 nonce
    );

    constructor() public {
    }

    function lockAssets(
        address asset,
        uint256 amount,
        bytes32 recipient,
        uint8 targetChain,
        uint32 nonce,
        bool refund_dust
    ) public {
        uint8 asset_chain = CHAIN_ID;
        uint8 decimals = ERC20Detailed(asset).decimals();
        bytes32 asset_address = bytes32(uint256(asset));

        emit LogTokensLocked(
            targetChain,
            asset_chain,
            decimals,
            asset_address,
            bytes32(uint256(msg.sender)),
            recipient,
            amount,
            nonce
        );
    }
}
