const sinon = require('sinon')

function getIPFSMock (isLatest = false) {
  const ipfsMock = {
    add: sinon.mock(),
    addFromFs: sinon.mock(),
    pin: {
      add: sinon.mock(),
      rm: sinon.mock()
    },
    id: sinon.stub(),
    swarm: {
      connect: sinon.stub()
    },
    bootstrap: {
      add: sinon.stub()
    },
    cat: sinon.stub(),
    get: sinon.stub()
  }
  ipfsMock.id.returns({
    addresses: ['/ip4/127.0.0.1/tcp/4001/ipfs/QmPjSNZPCTmQsKAUM7QDjAzymcbxaVVbRcV5pZvBRMZmca']
  })
  ipfsMock.swarm.connect.returns({ Strings: ['test-res'] })
  ipfsMock.bootstrap.add.returns('')
  ipfsMock.cat.throws()
  ipfsMock.get.throws()

  // `ipfsLatest` add fn returns `cid` key instead of `hash`
  let addResp
  if (isLatest) {
    addResp = { cid: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6' }
    const asyncIterableIpfsAddResp = {
      async * [Symbol.asyncIterator] () {
        yield { cid: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6' }
      }
    }
    ipfsMock.add.returns(asyncIterableIpfsAddResp)
  } else {
    addResp = { hash: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6' }
    ipfsMock.add.returns([addResp])
    ipfsMock.addFromFs.returns([addResp])
  }

  return ipfsMock
}

module.exports = { getIPFSMock }
