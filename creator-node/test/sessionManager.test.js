const assert = require('assert')
const proxyquire = require('proxyquire')
const _ = require('lodash')

const models = require('../src/models')
const DBManager = require('../src/dbManager')
const { iteratee } = require('lodash')

describe('SessionManager', async function () {
    describe('createSession', async function () {
        describe('When called with a String cnodeUserUUID', async function () {
            it('creates a session in the SessionToken table', async function () {})
            it('creates a session in Redis', async function () {})
        })
    })
    describe('verifySession', async function () {
        describe('When a cnodeUserUUID is associated with the token', async function () {
            it('returns the cnodeUserUUID', async function () {

            })
        })
        describe('When a cnodeUserUUID is not associated with the token', async function () {
            it('returns null', async function () {})
        })
    })
    describe('deleteSession', async function () {
        describe('when called with a SessionToken that exists in the DB', async function () {
            describe('And in Redis', async function () {
                it('deletes the session in the SessionToken table', async function () {

                })
                it('deletes the session in the DB', async function () {

                })
                it('deletes the session in Redis', async function () {

                })
            })
            describe('but not in Redis', async function () {
                it('throws an error', async function () {})
            })
        })
        describe('when called with a SessionToken that does not exist in the DB', async function () {
            it('throws an error', async function () {})
        })
    })
    describe('deleteSessions', async function () {
        describe('when called with an Array of SessionTokens', async function () {
            describe('and the DB transaction fails', async function () {
                it('retries the transaction', async function () {

                })
                describe('and the second DB transaction does not fail', async function () {
                    it('submits a batch transaction to Redis', async function () {

                    })
                })
                describe('and the second DB transaction fails', async function () {
                    it('throws an error', async function () {

                    })
                })
            })
        })
    })
})
