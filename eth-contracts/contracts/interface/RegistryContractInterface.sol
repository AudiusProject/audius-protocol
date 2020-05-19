pragma solidity ^0.5.0;


interface RegistryContractInterface {
  function setRegistry(address _registryAddress) external;
  function kill() external;
}