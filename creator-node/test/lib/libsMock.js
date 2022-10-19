const sinon = require('sinon')
const { encode, decode } = require('../../src/hashids')

function getLibsMock() {
  const libsMock = {
    ethContracts: {
      getServiceProviderList: (serviceType) => {
        switch (serviceType) {
          case 'content-node': {
            return [
              {
                blockNumber: 163,
                delegateOwnerWallet:
                  '0x1F9a71dEC0eCf3FC8E916a17458f173AC453ca33',
                endpoint: 'http://mock-cn1.audius.co',
                owner: '0x1F9a71dEC0eCf3FC8E916a17458f173AC453ca33',
                spID: 1,
                type: 'content-node'
              },
              {
                blockNumber: 165,
                delegateOwnerWallet:
                  '0xc0B03742234deFbAFaD16E1fAf5F8b069b1AeB7d',
                endpoint: 'http://mock-cn2.audius.co',
                owner: '0xc0B03742234deFbAFaD16E1fAf5F8b069b1AeB7d',
                spID: 2,
                type: 'content-node'
              },
              {
                blockNumber: 167,
                delegateOwnerWallet:
                  '0x242E1Cd7bB405941063814c241a1f046CCC9810b',
                endpoint: 'http://mock-cn3.audius.co',
                owner: '0x242E1Cd7bB405941063814c241a1f046CCC9810b',
                spID: 3,
                type: 'content-node'
              },
              {
                blockNumber: 169,
                delegateOwnerWallet:
                  '0x242E1Cd7bB405941063814c241a1f046CCCaaaaa',
                endpoint: 'http://mock-cn4.audius.co',
                owner: '0x242E1Cd7bB405941063814c241a1f046CCCaaaaa',
                spID: 4,
                type: 'content-node'
              }
            ]
          }
          case 'discovery-node': {
            return [
              {
                delegateOwnerWallet:
                  '0x1D9c77BcfBfa66D37390BF2335f0140979a6122B',
                type: 'discovery-node'
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
    Playlist: {
      getPlaylists: sinon.mock().atLeast(1)
    },
    Utils: {
      encodeHashId: sinon.mock().atLeast(1)
    },
    discoveryProvider: {
      discoveryProviderEndpoint: 'http://docker.for.mac.localhost:5000',
      getUserReplicaSet: sinon.mock().atLeast(1)
    },
    web3Manager: {
      verifySignature: () => '0x7c95A677106218A296EcEF1F577c3aE27f0340cd'
    }
  }

  libsMock.Utils.encodeHashId.callsFake((id) => {
    return encode(id)
  })

  libsMock.discoveryProvider.getUserReplicaSet.callsFake(
    ({ encodedUserId }) => {
      const user_id = decode(encodedUserId)
      return {
        user_id,
        wallet: '0xadd36bad12002f1097cdb7ee24085c28e960fc32',
        primary: 'http://mock-cn1.audius.co',
        secondary1: 'http://mock-cn2.audius.co',
        secondary2: 'http://mock-cn3.audius.co',
        primarySpID: 1,
        secondary1SpID: 2,
        secondary2SpID: 3
      }
    }
  )

  libsMock.contracts.UserReplicaSetManagerClient.getUserReplicaSet.returns({
    primaryId: 1,
    secondaryIds: [2, 3]
  })
  libsMock.contracts.UserReplicaSetManagerClient.getUserReplicaSetAtBlockNumber.returns(
    { primaryId: 1, secondaryIds: [2, 3] }
  )

  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint.returns(
    '1'
  )

  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo =
    async (serviceType, spID) => {
      spID = parseInt(spID)
      switch (spID) {
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
          return {
            endpoint: 'http://mock-cn1.audius.co',
            owner: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25',
            spID: '1',
            type: 'content-node',
            blockNumber: 1234,
            delegateOwnerWallet: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
          }
        default:
          return {
            owner: '0x0000000000000000000000000000000000000000',
            endpoint: '',
            spID,
            type: 'content-node',
            blockNumber: 0,
            delegateOwnerWallet: '0x0000000000000000000000000000000000000000'
          }
      }
    }
  libsMock.ethContracts.ServiceProviderFactoryClient.getServiceProviderList =
    libsMock.ethContracts.getServiceProviderList
  libsMock.User.getUsers.returns([
    {
      creator_node_endpoint:
        'http://mock-cn1.audius.co,http://mock-cn2.audius.co,http://mock-cn3.audius.co',
      blocknumber: 10,
      track_blocknumber: 10
    }
  ])
  libsMock.User.getUsers.atLeast(1)

  return libsMock
}

module.exports = { getLibsMock }
