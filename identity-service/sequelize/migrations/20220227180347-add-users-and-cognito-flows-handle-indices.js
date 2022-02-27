'use strict'

module.exports = {
  up: (queryInterface) => {
    const addUsersHandleIndexPromise = queryInterface.addIndex('Users', ['handle'])
    const addCognitoFlowsHandleIndexPromise = queryInterface.addIndex('CognitoFlows', ['handle'])
    return Promise.all([addUsersHandleIndexPromise, addCognitoFlowsHandleIndexPromise])
  },

  down: (queryInterface) => {
    const dropUsersHandleIndexPromise = queryInterface.removeIndex('Users', ['handle'])
    const dropCognitoFlowsHandleIndexPromise = queryInterface.removeIndex('CognitoFlows', ['handle'])
    return Promise.all([dropUsersHandleIndexPromise, dropCognitoFlowsHandleIndexPromise])
  }
}
