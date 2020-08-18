pragma solidity ^0.5.0;


/// Simple test contract with self destruct function
/// Used to validate contractHash enforcement in governance
contract MockAccount {
    address public owner;

    constructor(address payable _owner) public {
        owner = _owner;
    }

    function setOwner(address _owner) public {
        owner = _owner;
    }

    function destroy(address payable recipient) public {
        require(msg.sender == owner, "Invalid sender");
        selfdestruct(recipient);
    }
}

