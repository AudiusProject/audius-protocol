const DiskManager = require('./diskManager')
const assert = require('assert')
const config = require('./config')
const path = require('path')

describe('Test DiskManager', function () {
  before(function () {
    // stub out this function which ensures the directory path exists to return true
    DiskManager.ensureDirPathExists = async () => true
  })

  it('Should pass if storagePath is correctly set', function () {
    assert.deepStrictEqual(config.get('storagePath'), DiskManager.getConfigStoragePath())
  })

  it('Should pass if computeBasePath returns the correct path', function () {
    const fullPath = DiskManager.computeBasePath('QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    const validPath = path.join(DiskManager.getConfigStoragePath(), 'muU', 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(fullPath, validPath)
  })

  it('Should fail if fileName is not passed into computeBasePath', function () {
    try {
      DiskManager.computeBasePath()
    } catch (e) {
      assert.ok(e.message.includes('Please pass in a valid fsDest to computeBasePath'))
    }
  })

  it(`Should fail if fileName doesn't contain the appropriate amount of characters`, function () {
    try {
      DiskManager.computeBasePath('asd')
    } catch (e) {
      assert.ok(e.message.includes('Please pass in a valid fsDest to computeBasePath'))
    }
  })

  it(`Should fail if fileName contains a slash`, function () {
    try {
      DiskManager.computeBasePath('/file_storage/asdf')
    } catch (e) {
      assert.ok(e.message.includes('Cannot pass in a directory path into this function, please pass in the leaf dir or file name'))
    }
  })

  it('Should pass if computeBasePath returns the correct path', function () {
    const fullPath = DiskManager.computeFilePathInDir('QmdirectoryName', 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    const validPath = path.join(DiskManager.getConfigStoragePath(), 'Nam', 'QmdirectoryName', 'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6')
    assert.deepStrictEqual(fullPath, validPath)
  })

  it('Should fail if dirName and fileName are not passed into computeBasePath', function () {
    try {
      const fullPath = DiskManager.computeFilePathInDir()
    } catch (e) {
      assert.ok(e.message.includes('Must pass in valid dirName and fileName'))
    }
  })
})
