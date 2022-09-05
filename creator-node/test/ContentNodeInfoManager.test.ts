/* eslint-disable no-unused-expressions */
import type {
  LibsServiceProvider,
  EthContracts
} from '../src/services/ContentNodeInfoManager'

import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import bunyan from 'bunyan'
import _ from 'lodash'

import redis from '../src/redis'
import util from '../src/utils.js'
import { ContentNodeInfoManager } from '../src/services/ContentNodeInfoManager'

chai.use(sinonChai)
const { expect } = chai

const SERVICE_PROVIDERS_FROM_LIBS: LibsServiceProvider[] = [
  {
    spID: 1,
    blockNumber: 175,
    delegateOwnerWallet: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
    endpoint: 'http://cn1_creator-node_1:4000',
    owner: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
    type: 'content-node'
  },
  {
    spID: 2,
    blockNumber: 170,
    delegateOwnerWallet: 'testCn2Wallet',
    endpoint: 'http://cn2_creator-node_1:4001',
    owner: 'testCn2Owner',
    type: 'content-node'
  }
]

describe('test ContentNodeInfoManager', function () {
  let sandbox: sinon.SinonSandbox
  let logger: bunyan
  let makeEthContractsStub: () => Promise<EthContracts>
  beforeEach(async function () {
    await redis.flushall()
    sandbox = sinon.createSandbox()
    logger = bunyan.createLogger({ name: 'test_logger' })
    const getServiceProviderListStub = sandbox
      .stub()
      .resolves(SERVICE_PROVIDERS_FROM_LIBS)
    makeEthContractsStub = sandbox.stub().resolves({
      getServiceProviderList: getServiceProviderListStub
    })
  })

  afterEach(function () {
    sandbox.restore()
  })

  async function fetchAndVerifyMapping(cacheTtlSec: number) {
    const mapping = await ContentNodeInfoManager(
      logger,
      redis,
      makeEthContractsStub,
      cacheTtlSec
    ).getMapOfSpIdToChainInfo()
    expect(mapping).to.have.property('size', 2)
    expect(mapping.get(1)).to.eql({
      endpoint: 'http://cn1_creator-node_1:4000',
      delegateOwnerWallet: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
    })
    expect(mapping.get(2)).to.eql({
      endpoint: 'http://cn2_creator-node_1:4001',
      delegateOwnerWallet: 'testCn2Wallet'
    })
  }

  it('should fetch the mapping, store it in redis, and expire', async function () {
    const cacheTtlSec = 1
    // Mapping should be fetched from chain on the first call
    await fetchAndVerifyMapping(cacheTtlSec)
    expect(makeEthContractsStub).to.have.been.calledOnce

    // Mapping should be cached in redis on the second call
    await fetchAndVerifyMapping(cacheTtlSec)
    expect(makeEthContractsStub).to.have.been.calledOnce

    // Mapping should expire from cache and be fetched from chain on the third call
    await util.timeout(cacheTtlSec * 1000 + 1)
    await fetchAndVerifyMapping(cacheTtlSec)
    expect(makeEthContractsStub).to.have.been.calledTwice
  })

  it('should perform lookup by SP ID with cache miss', async function () {
    const contentNodeInfo = await ContentNodeInfoManager(
      logger,
      redis,
      makeEthContractsStub
    ).getContentNodeInfoFromSpId(2)

    // Mapping should be fetched from chain on the first call
    expect(makeEthContractsStub).to.have.been.calledOnce

    expect(contentNodeInfo).to.not.be.undefined
    expect(contentNodeInfo!.endpoint).to.equal('http://cn2_creator-node_1:4001')
    expect(contentNodeInfo!.delegateOwnerWallet).to.equal('testCn2Wallet')
  })
})
