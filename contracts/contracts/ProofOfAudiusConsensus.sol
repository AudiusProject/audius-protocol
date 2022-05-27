pragma solidity ^0.5.0;

import "./SigningLogicInitializable.sol";

contract ProofOfAudiusConsensus is SigningLogicInitializable {
    event InitiateChange(bytes32 indexed parentHash, address[] newSet);
    event ChangeFinalized(address[] newSet);

    address[] public currentValidators;
    address[] public pendingList;

    struct ValidatorState {
        // Current owner key
        address ownerKey;
        // Index into current validators
        uint index;
        // Is this a validator.
        bool isValidator;
        // Is a validator finalized.
        bool isValidatorFinalized;
    }

    mapping (address => ValidatorState) validatorState;

    address public systemAddress = 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE;
    bool public finalized = false;

    address public seedAddress;
    bool seedComplete;

    modifier onlySystemAndNotFinalized() {
        require(msg.sender == systemAddress && !finalized);
        _;
    }

    function initialize(address _seedAddress, uint _networkId) public initializer {
        require(_seedAddress != address(0x00), "Invalid seed");
        seedAddress = _seedAddress;

        // Initialize base Signing Logic contract
        SigningLogicInitializable.initialize(
            "ProofOfAudiusConsensus",
            "1",
            _networkId
        );

        seedComplete = false;
    }

    function seedValidators(
        address[] calldata _miningKeys,
        address[] calldata _ownerKeys
    ) external {
        require(msg.sender == seedAddress);
        require(seedComplete == false);
        require(_miningKeys.length == _ownerKeys.length, "Mismatched parameters");

        for (uint i = 0; i < _miningKeys.length; i++) {
            require(validatorState[_miningKeys[i]].ownerKey == address(0x00), "Already set");
            currentValidators.push(_miningKeys[i]);
            validatorState[_miningKeys[i]] = ValidatorState({
                ownerKey: _ownerKeys[i],
                index: i,
                isValidator: true,
                isValidatorFinalized: true
            });
        }

        pendingList = currentValidators;
        seedComplete = true;
    }

    /// Called when an initiated change reaches finality and is activated.
    /// Only valid when msg.sender == SUPER_USER (EIP96, 2**160 - 2)
    ///
    /// Also called when the contract is first enabled for consensus. In this case,
    /// the "change" finalized is the activation of the initial set.
    function finalizeChange() public onlySystemAndNotFinalized {
        finalized = true;
        currentValidators = pendingList;

        for (uint256 i = 0; i < currentValidators.length; i++) {
            validatorState[currentValidators[i]].isValidator = true;
            validatorState[currentValidators[i]].isValidatorFinalized = true;
        }

        emit ChangeFinalized(currentValidators);
    }

    // NOTE - In reality this function will have several more signatures passed in to support EIP712 typehash based signature validation (existing validators must add new validators etc.)
    function addValidator(
        address _miningKey,
        address _ownerWallet
    ) external {
        require(validatorState[_miningKey].ownerKey == address(0x00), "Already set");
        validatorState[_miningKey] = ValidatorState({
            ownerKey: _ownerWallet,
            index: pendingList.length,
            isValidator: true,
            isValidatorFinalized: false
        });
        pendingList.push(_ownerWallet);
        finalized = false;
        emit InitiateChange(blockhash(block.number - 1), pendingList);
    }

    // NOTE - In reality this function will have several more signatures passed in to support EIP712 typehash based signature validation (existing validators must remove new validators etc.)
    function removeValidator(
        address _miningKey
    ) external {
        require(validatorState[_miningKey].ownerKey != address(0x00), "Must already be set");
        uint256 removedIndex = validatorState[_miningKey].index;

        // Can not remove the last validator.
        uint256 lastIndex = pendingList.length - 1;
        address lastValidator = pendingList[lastIndex];
        // Override the removed validator with the last one.
        pendingList[removedIndex] = lastValidator;
        // Update the index of the last validator.
        validatorState[lastValidator].index = removedIndex;
        pendingList.length--;

        validatorState[_miningKey].ownerKey = address(0x00);
        validatorState[_miningKey].index = 0;
        validatorState[_miningKey].isValidator = false;
        validatorState[_miningKey].isValidatorFinalized = false;

        finalized = false;

        emit InitiateChange(blockhash(block.number - 1), pendingList);
    }

    /// Get current validator set (last enacted or initial if no changes ever made)
    function getValidators() public view returns (address[] memory) {
        return currentValidators;
    }

    function getPendingList() public view returns (address[] memory) {
        return pendingList;
    }

    function getValidatorOwner(address _validator) public view returns (address) {
        return validatorState[_validator].ownerKey;
    }

    function isValidator(address _miningKey) public view returns(bool) {
        return validatorState[_miningKey].isValidator;
    }

    function isValidatorFinalized(address _miningKey) public view returns(bool) {
        return validatorState[_miningKey].isValidatorFinalized;
    }

}