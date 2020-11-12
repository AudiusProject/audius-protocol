const DiskManager = require('./diskManager')
const assert = require('assert')
const config = require('./config')

describe('Test DiskManager', function () {
  before(function () {
    // stub out this function which ensures the directory path exists to return true
    DiskManager.ensureDirPathExists = async () => true
  })

  it('Should pass if storagePath is correctly set', function () {
    assert.deepStrictEqual(config.get('storagePath'), DiskManager.getConfigStoragePath())
  })

  it('Should pass if computeCIDFilePath returns the correct path', function () {
    const fullPath = DiskManager.computeCIDFilePath('QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    const validPath = `${DiskManager.getConfigStoragePath()}/muU/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6`
    assert.deepStrictEqual(fullPath, validPath)
  })

  it('Should fail if fileName is not passed into computeCIDFilePath', function () {
    try {
      DiskManager.computeCIDFilePath()
    } catch (e) {
      assert.ok(e.message.includes('Please pass in a valid fileName to computeCIDFilePath'))
    }
  })

  it(`Should fail if fileName doesn't contain the appropriate amount of characters`, function () {
    try {
      DiskManager.computeCIDFilePath('asd')
    } catch (e) {
      assert.ok(e.message.includes('Please pass in a valid fileName to computeCIDFilePath'))
    }
  })
})
