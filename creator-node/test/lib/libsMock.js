const sinon = require('sinon')

function getLibsMock () {
  const libsMock = {
    ethContracts: {
      ServiceProviderFactoryClient: {
        getServiceProviderIdFromEndpoint: sinon.mock().atLeast(1),
        getServiceEndpointInfo: sinon.mock().atLeast(1)
      }
    },
    User: {
      getUsers: sinon.mock()
    },
    discoveryProvider: {
      discoveryProviderEndpoint: 'http://docker.for.mac.localhost:5000'
    }
  }
  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint.returns('1')
  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo.returns({ 'endpoint': 'http://localhost:5000' })
  libsMock.User.getUsers.returns([{ 'creator_node_endpoint': 'http://localhost:5000', 'blocknumber': 10, 'track_blocknumber': 10 }])
  libsMock.User.getUsers.atMost(10)

  return libsMock
}

module.exports = { getLibsMock }
