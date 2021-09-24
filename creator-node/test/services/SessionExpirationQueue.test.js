const assert = require('assert')
const proxyquire = require('proxyquire')
const _ = require('lodash')

const models = require('../src/models')
const DBManager = require('../src/dbManager')
const utils = require('../src/utils')
const { after, iteratee } = require('lodash')

describe('Test SessionExpirationQueue', async function () {
    describe('on startup', async function () {
        describe('runs the job to expire sessions', async function () {

        })
        describe('runs the job to expire sessions daily', async function () {

        })
    })
    describe('on processing', async function () {
        describe('When expired sessions exist in DB', async function () {
            describe('and the transaction completes without errors', async function () {
                it('deletes expired sessions from the DB and Redis via sessionManager', async function () { // this functionality is tested in-depth in sessionManager.test.js

                })
                it('does not delete non-expired sessions from the DB and Redis', async function () {

                })
            })
            describe('and the transaction fails with an error', async function () {
                it('does not throw an error', async function () {

                })
                it('logs the failure', async function () {

                })
            })
        })
        describe('When expired sessions do not exist in the DB', async function () {
            it('does not delete any sessions from the DB or Redis', async function () {

            })
        })
    })
})