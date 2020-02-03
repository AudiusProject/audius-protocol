import * as _lib from './_lib/lib.js'
import {
  Registry,
  UserStorage,
  UserFactory
} from './_lib/artifacts.js'
import * as _constants from './utils/constants'

contract('UserFactory', async (accounts) => {
  const testUserId1 = 1
  const testUserId2 = 2
  const testUserId3 = 3

  let registry
  let userStorage
  let userFactory

  beforeEach(async () => {
    registry = await Registry.new()
    const networkId = Registry.network_id
    userStorage = await UserStorage.new(registry.address)
    await registry.addContract(_constants.userStorageKey, userStorage.address)
    userFactory = await UserFactory.new(registry.address, _constants.userStorageKey, networkId, accounts[5])
    await registry.addContract(_constants.userFactoryKey, userFactory.address)
  })

  it('Should add single user', async () => {
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue
    )
  })

  it('Should fail to update user due to lack of ownership of user', async () => {
    // create user from accounts[0]
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue
    )

    // attempt to update above user from different account
    let caughtError = false
    try {
      await _lib.updateUserNameAndValidate(userFactory, testUserId1, accounts[1])
    } catch (e) {
      // expected error
      if (e.message.indexOf('Caller does not own userId') >= 0) {
        caughtError = true
      } else {
        // other unexpected error - throw it normally
        throw e
      }
    }

    assert.isTrue(caughtError, "Failed to handle case where calling address tries to update user it doesn't own")
  })

  it('Should add multiple users', async () => {
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue)

    await _lib.addUserAndValidate(
      userFactory,
      testUserId2,
      accounts[0],
      _constants.testMultihash.digest2,
      _constants.userHandle2,
      true)
  })

  it('Should fail to add user if handle is already taken', async () => {
    let caughtError = false

    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandleUC,
      _constants.isCreatorTrue)

    // attempt to add a user with the same error and catch the error
    // Not sure this is the best way to catch this revert, but best way I could think of and backed by SO
    // https://ethereum.stackexchange.com/questions/48627/how-to-catch-revert-error-in-truffle-test-javascript
    try {
      await _lib.addUserAndValidate(
        userFactory,
        testUserId2,
        accounts[0],
        _constants.testMultihash.digest2,
        _constants.userHandleMC,
        true)
    } catch (e) {
      // expected error
      if (e.message.indexOf('Handle is already taken') >= 0) {
        caughtError = true
      } else if (e.message.indexOf('satisfies all conditions set by Solidity `require` statements.') >= 0) {
        // test to satisfy returns from the POA network
        // error message from POA is not explicit about the error
        caughtError = true
      } else {
        // other unexpected error - throw it normally
        throw e
      }
    }

    assert.isTrue(caughtError, 'Failed to handle case where two users use the same handle (case-insensitive)')
  })

  it('Should ensure users can only be created with valid handles', async () => {
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue
    )

    await _lib.addUserAndValidate(
      userFactory,
      testUserId2,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle2,
      _constants.isCreatorTrue
    )

    let caughtError = false
    try {
      await _lib.addUserAndValidate(
        userFactory,
        testUserId3,
        accounts[0],
        _constants.testMultihash.digest1,
        _constants.userHandleBad,
        _constants.isCreatorTrue
      )
    } catch (e) {
      // expected error
      if (e.message.indexOf('invalid character found in handle') >= 0) {
        caughtError = true
      } else {
        // other unexpected error - throw it normally
        throw e
      }
      caughtError = true
    }

    assert.isTrue(caughtError, 'Failed to prevent user creation with invalid handle')
  })

  it('Should mark and unmark user as verified', async () => {
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue)

    const v1event = await _lib.markUserVerifiedAndValidate(userFactory, accounts[5], testUserId1, true)
    const v2event = await _lib.markUserVerifiedAndValidate(userFactory, accounts[5], testUserId1, false)

    assert.isTrue(v1event.isVerified, 'Failed to mark user as verified')
    assert.isFalse(v2event.isVerified, 'Failed to mark user as un-verified')
  })

  it('Should fail to mark verified with incorrect key', async () => {
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue)

    let caughtError = false
    try {
      await _lib.markUserVerifiedAndValidate(userFactory, accounts[0], testUserId1, true)
    } catch (e) {
      caughtError = true
    }

    assert.isTrue(caughtError, 'Failed to prevent verification by invalid address')
  })

  it('Should upgrade UserStorage used by UserFactory', async () => {
    // add user
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue)

    // deploy new UserStorage instance
    let userStorage2 = await UserStorage.new(registry.address)

    // upgrade registered UserStorage
    await registry.upgradeContract(_constants.userStorageKey, userStorage2.address)

    // confirm first UserStorage instance is dead
    _lib.assertNoContractExists(userStorage.address)

    // add another user
    await _lib.addUserAndValidate(
      userFactory,
      testUserId1,
      accounts[0],
      _constants.testMultihash.digest1,
      _constants.userHandle1,
      _constants.isCreatorTrue)
  })
})
