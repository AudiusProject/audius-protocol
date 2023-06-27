/* global artifacts */

/**
 * Contains all the contracts referenced in Audius unit tests
 */

export const EntityManager = artifacts.require('./contract/EntityManager')

// Proxy contracts
export const AdminUpgradeabilityProxy = artifacts.require(
  './contracts/AdminUpgradeabilityProxy'
)
export const TestEntityManager = artifacts.require(
  './contract/test/TestEntityManager'
)
