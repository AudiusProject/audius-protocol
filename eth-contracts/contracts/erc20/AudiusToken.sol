pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "../InitializableV2.sol";


/** Upgradeable ERC20 token that is Detailed, Mintable, Pausable, Burnable. */
contract AudiusToken is InitializableV2, ERC20, ERC20Detailed, ERC20Mintable, ERC20Pausable, ERC20Burnable {
    string constant NAME = "TestAudius";
    string constant SYMBOL = "TAUDS";
    // standard - imitates relationship between Ether and Wei
    uint8 constant DECIMALS = 18;
    // 10^27 = 1 billion tokens, 18 decimal places
    // 1 TAUD = 1 * 10^18
    uint256 constant INITIAL_SUPPLY = 1000000000 * 10**uint256(DECIMALS);

    function initialize() public initializer {
        // ERC20 has no initialize function
        // ERC20Detailed provides setters/getters for name, symbol, decimals properties
        ERC20Detailed.initialize(NAME, SYMBOL, DECIMALS);
        // ERC20Mintable isa MinterRole; initialize calls _addMinter(msg.sender)
        ERC20Mintable.initialize(msg.sender);
        // ERC20Burnable has no initialize function
        // ERC20Pausable isa Pausable isa PauserRole; initialize calls _addPauser(msg.sender)
        ERC20Pausable.initialize(msg.sender);

        InitializableV2.initialize();

        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
