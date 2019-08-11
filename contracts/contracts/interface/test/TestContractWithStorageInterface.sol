pragma solidity ^0.5.0;


interface TestContractWithStorageInterface {
  function getData(bytes32 _key) external view returns (bytes32 val);
}