const sinon = require('sinon')

function getIPFSMock () {
  const ipfsMock = {
    add: sinon.mock(),
    addFromFs: sinon.mock(),
    pin: {
      add: sinon.mock()
    }
  }
  ipfsMock.add.returns([{ hash: 'testCIDLink' }])
  ipfsMock.addFromFs.returns([{ hash: 'testCIDLink' }])

  return ipfsMock
}

module.exports = { getIPFSMock }
