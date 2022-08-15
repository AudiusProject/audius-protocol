const chai = require('chai')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
const { expect } = chai

describe('test recoverOrphanedData job processor', function () {
  it('Finds and reconciles data when this node is not in replica set', async function () {
    expect(true) // TODO: TDD
  })

  it('Skips when when this node is in replica set', async function () {
    expect(true) // TODO: TDD
  })
})
