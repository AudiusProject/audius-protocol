const sinon = require('sinon')

function getLibsMock () {
  const libsMock = {
    ethContracts: {
      getServiceProviderList: (serviceType) => {
        switch (serviceType) {
          case 'content-node': {
            return [
              {
                blockNumber: 163,
                delegateOwnerWallet: '0x1F9a71dEC0eCf3FC8E916a17458f173AC453ca33',
                endpoint: 'http://cn1_creator-node_1:4000',
                owner: '0x1F9a71dEC0eCf3FC8E916a17458f173AC453ca33',
                spID: 1,
                type: 'content-node'
              },
              {
                blockNumber: 165,
                delegateOwnerWallet: '0xc0B03742234deFbAFaD16E1fAf5F8b069b1AeB7d',
                endpoint: 'http://cn2_creator-node_1:4001',
                owner: '0xc0B03742234deFbAFaD16E1fAf5F8b069b1AeB7d',
                spID: 2,
                type: 'content-node'
              },
              {
                blockNumber: 167,
                delegateOwnerWallet: '0x242E1Cd7bB405941063814c241a1f046CCC9810b',
                endpoint: 'http://cn3_creator-node_1:4002',
                owner: '0x242E1Cd7bB405941063814c241a1f046CCC9810b',
                spID: 3,
                type: 'content-node'
              }
            ]
          }
          default: {
            return []
          }
        }
      },
      ServiceProviderFactoryClient: {
        getServiceProviderIdFromEndpoint: sinon.mock().atLeast(1),
        getServiceEndpointInfo: sinon.mock().atLeast(1)
      }
    },
    contracts: {
      UserReplicaSetManagerClient: {
        getUserReplicaSet: sinon.mock().atLeast(1),
        getUserReplicaSetAtBlockNumber: sinon.mock().atLeast(1)
      }
    },
    User: {
      getUsers: sinon.mock().atLeast(1)
    },
    discoveryProvider: {
      discoveryProviderEndpoint: 'http://docker.for.mac.localhost:5000'
    }
  }

  libsMock.contracts.UserReplicaSetManagerClient.getUserReplicaSet.returns({ primaryId: 1, secondaryIds: [2, 3] })
  libsMock.contracts.UserReplicaSetManagerClient.getUserReplicaSetAtBlockNumber.returns({ primaryId: 1, secondaryIds: [2, 3] })

  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint.returns('1')

  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo = async (serviceType, spId) => {
    switch (spId) {
      case 2:
        return {
          endpoint: 'http://mock-cn2.audius.co',
          owner: '0xBdb47ebFF0eAe1A7647D029450C05666e22864Fb',
          spID: '2',
          type: 'content-node',
          blockNumber: 1235,
          delegateOwnerWallet: '0xBdb47ebFF0eAe1A7647D029450C05666e22864Fb'
        }

      case 3:
        return {
          endpoint: 'http://mock-cn3.audius.co',
          owner: '0x1Fffaa556B42f4506cdb01D7BbE6a9bDbb0E5f36',
          spID: '3',
          type: 'content-node',
          blockNumber: 1236,
          delegateOwnerWallet: '0x1Fffaa556B42f4506cdb01D7BbE6a9bDbb0E5f36'
        }

      case 1:
      default:
        return {
          endpoint: 'http://mock-cn1.audius.co',
          owner: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25',
          spID: '1',
          type: 'content-node',
          blockNumber: 1234,
          delegateOwnerWallet: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
        }
    }
  }
  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderList = libsMock.ethContracts.getServiceProviderList
  libsMock.User.getUsers.returns([{ 'creator_node_endpoint': 'http://mock-cn1.audius.co,http://mock-cn2.audius.co,http://mock-cn3.audius.co', 'blocknumber': 10, 'track_blocknumber': 10 }])
  libsMock.User.getUsers.atLeast(1)

  return libsMock
}

module.exports = { getLibsMock }
