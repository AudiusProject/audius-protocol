pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";


contract AudiusToken is ERC20, ERC20Detailed, ERC20Mintable, ERC20Pausable {
    string constant NAME = "TestAudius";
    string constant SYMBOL = "TAUDS";
    // standard - imitates relationship between Ether and Wei
    uint8 constant DECIMALS = 18;
    // 10^27 = 1 billion tokens, 18 decimal places
    // 1 TAUD = 1 * 10^18
    uint256 constant INITIAL_SUPPLY = 1000000000 * 10**uint256(DECIMALS);

    constructor()
        // ERC20Pausable isa Pausable isa PauserRole; constructor calls _addPauser(msg.sender)
        ERC20Pausable()
        // ERC20Mintable isa MinterRole; constructor calls _addMinter(msg.sender)
        ERC20Mintable()
        // ERC20Detailed provides setters/getters for name, symbol, decimals properties
        ERC20Detailed(NAME, SYMBOL, DECIMALS)
        ERC20()
        public
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
