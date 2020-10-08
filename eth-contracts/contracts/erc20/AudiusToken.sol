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
    }
}
