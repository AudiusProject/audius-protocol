pragma solidity ^0.5.0;

import "../registry/RegistryContract.sol";
import "../interface/RegistryInterface.sol";


/** @title The persistent storage for Audius Users */
contract UserStorage is RegistryContract {

    bytes32 constant CALLER_REGISTRY_KEY = "UserFactory";

    RegistryInterface registry = RegistryInterface(0);

    /** @dev - Uniquely assigned userId, incremented for each new assignment */
    uint userId = 1;
    /** @dev - User wallet addresses, key = userId */
    mapping(uint => address) private userWallets;

    /**
    There are two mappings related to storing user handles
    `userHandles` is used to correlate user id to handle so all events emitted contain handle.
    `handlesTaken` is a way to see if a handle is already taken.

    The discovery service indexes the metadata from the NewUser and UpdateUser events, so handle
    needs to be emitted from both. Because update doesn't have a handle passed in, we need a way
    to look up the handle for a user without iterating through the handlesTaken. Same holds vice
    versa if we have to iterate through all users to find if a handle is taken.
    */

    /** @dev - mapping of userId => user handle (case-preserved) */
    mapping(uint => bytes16) public userHandles;
    /** @dev - mapping of handle (lower-case) => taken
     *  handles are stored lower-cased for constant-time case-insensitive lookup of handlesTaken
     */
    mapping(bytes16 => bool) public handlesTaken;

    constructor(address _registryAddress) public {
        require(
            _registryAddress != address(0x00),
            "Requires non-zero _registryAddress");
        registry = RegistryInterface(_registryAddress);
    }

    function addUser(
        address _wallet,
        bytes16 _handle,
        bytes16 _handleLower
    ) external onlyRegistrant(CALLER_REGISTRY_KEY) returns (uint newUserId)
    {
        userWallets[userId] = _wallet;
        userHandles[userId] = _handle;
        handlesTaken[_handleLower] = true;

        newUserId = userId;
        userId += 1;
        require(userId != newUserId, "expected incremented userId");

        return newUserId;
    }

    function getUser(uint _userId)
    external view onlyRegistrant(CALLER_REGISTRY_KEY) returns (address wallet, bytes16 handle)
    {
        return (
            userWallets[_userId],
            userHandles[_userId]
        );
    }

    function userExists(uint _id) external view onlyRegistrant(CALLER_REGISTRY_KEY)
    returns (bool exists)
    {
        require(_id > 0, "invalid user ID");
        return (userWallets[_id] != address(0x00));
    }

    function handleIsTaken(bytes16 _handleLower) external view onlyRegistrant(CALLER_REGISTRY_KEY)
    returns (bool isTaken)
    {
        return (handlesTaken[_handleLower] == true);
    }
}
