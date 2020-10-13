pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "../InitializableV2.sol";


/** Upgradeable ERC20 token that is Detailed, Mintable, Pausable, Burnable. */
contract AudiusToken is InitializableV2,
    ERC20,
    ERC20Detailed,
    ERC20Mintable,
    ERC20Pausable,
    ERC20Burnable
{
    string constant NAME = "Audius";

    string constant SYMBOL = "AUDIO";

    // Defines number of Wei in 1 token
    // 18 decimals is standard - imitates relationship between Ether and Wei
    uint8 constant DECIMALS = 18;

    // 10^27 = 1 billion (10^9) tokens, 18 decimal places
    // 1 TAUD = 1 * 10^18 wei
    uint256 constant INITIAL_SUPPLY = 1000000000 * 10**uint256(DECIMALS);

    // for ERC20 approve transactions in compliance with EIP 2612:
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2612.md
    // code below, in constructor, and in permit function adapted from the audited reference Uniswap implementation:
    // https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2ERC20.sol
    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint) public nonces;

    function initialize(address _owner, address governance) public initializer {
        // ERC20 has no initialize function

        // ERC20Detailed provides setters/getters for name, symbol, decimals properties
        ERC20Detailed.initialize(NAME, SYMBOL, DECIMALS);

        // ERC20Burnable has no initialize function. Makes token burnable

        // Initialize call makes token pausable & gives pauserRole to governance
        ERC20Pausable.initialize(governance);

        // Initialize call makes token mintable & gives minterRole to msg.sender
        ERC20Mintable.initialize(msg.sender);

        // Mints initial token supply & transfers to _owner account
        _mint(_owner, INITIAL_SUPPLY);

        // Transfers minterRole to governance
        addMinter(governance);
        renounceMinter();

        InitializableV2.initialize();

        // EIP712-compatible signature data
        uint chainId;
        assembly {
            chainId := chainid
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(NAME)),
                keccak256(bytes('1')),
                chainId,
                address(this)
            )
        );
    }

    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external {
        require(deadline >= block.timestamp, 'AudiusToken: Deadline has expired');
        bytes32 digest = keccak256(
            abi.encodePacked(
                '\x19\x01',
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
            )
        );
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress != address(0) && recoveredAddress == owner, 'AudiusToken: Invalid signature');
        _approve(owner, spender, value);
    }
}
