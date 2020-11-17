const sinon = require('sinon')

function getIPFSMock () {
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
  ipfsMock.add.returns([{ hash: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6' }])
  ipfsMock.addFromFs.returns([{ hash: 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6' }])
  ipfsMock.id.returns({
    addresses: ['/ip4/127.0.0.1/tcp/4001/ipfs/QmPjSNZPCTmQsKAUM7QDjAzymcbxaVVbRcV5pZvBRMZmca']
  })
  ipfsMock.swarm.connect.returns({ Strings: ['test-res'] })
  ipfsMock.bootstrap.add.returns('')
  ipfsMock.cat.throws()
  ipfsMock.get.throws()

  return ipfsMock
}

module.exports = { getIPFSMock }
