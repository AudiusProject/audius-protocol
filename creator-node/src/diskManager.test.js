const DiskManager = require('./diskManager')
const assert = require('assert')
const config = require('./config')
const path = require('path')

describe.only('Test DiskManager', function () {
  before(function () {
    // stub out this function which ensures the directory path exists to return true
    DiskManager.ensureDirPathExists = async () => true
  })

  /**
   * getConfigStoragePath
   */
  it('Should pass if storagePath is correctly set', function () {
    assert.deepStrictEqual(
      config.get('storagePath'),
      DiskManager.getConfigStoragePath()
    )
  })

  /**
   * getTmpTrackUploadArtifactsPath
   */
  it('Should pass if storagePath is correctly set', function () {
    const tmpTrackArtifactPath = path.join(
      DiskManager.getConfigStoragePath(),
      'files',
      'tmp_track_artifacts'
    )
    assert.deepStrictEqual(
      tmpTrackArtifactPath,
      DiskManager.getTmpTrackUploadArtifactsPath()
    )
  })

  /**
   * computeFilePath
   */
  it('Should pass if computeFilePath returns the correct path', function () {
    const fullPath = DiskManager.computeFilePath(
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    const validPath = path.join(
      DiskManager.getConfigStoragePath(),
      'files',
      'muU',
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    assert.deepStrictEqual(fullPath, validPath)
  })

  it('Should fail if fileName is not passed into computeFilePath', function () {
    try {
      DiskManager.computeFilePath()
    } catch (e) {
      assert.ok(
        e.message.includes('Please pass in a valid cid to computeFilePath')
      )
    }
  })

  it(`Should fail if fileName doesn't contain the appropriate amount of characters`, function () {
    try {
      DiskManager.computeFilePath('asd')
    } catch (e) {
      assert.ok(
        e.message.includes('Please pass in a valid cid to computeFilePath')
      )
    }
  })

  it(`Should fail if fileName contains a slash`, function () {
    try {
      DiskManager.computeFilePath('/file_storage/asdf')
    } catch (e) {
      assert.ok(
        e.message.includes('Please pass in a valid cid to computeFilePath')
      )
    }
  })

  /**
   * computeFilePathInDir
   */
  it('Should pass if computeFilePathInDir returns the correct path', function () {
    const fullPath = DiskManager.computeFilePathInDir(
      'QmRSvU8NtadxPPrP4M72wUPBiTqykqziWDuGr6q2arsYW4',
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    const validPath = path.join(
      DiskManager.getConfigStoragePath(),
      'files',
      'sYW',
      'QmRSvU8NtadxPPrP4M72wUPBiTqykqziWDuGr6q2arsYW4',
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
    )
    assert.deepStrictEqual(fullPath, validPath)
  })

  it('Should fail if dirName and fileName are not passed into computeFilePathInDir', function () {
    try {
      DiskManager.computeFilePathInDir()
    } catch (e) {
      assert.ok(e.message.includes('Must pass in valid dirName and fileName'))
    }
  })

  it('Should fail if dirName or fileName are not a CID passed into computeFilePathInDir', function () {
    try {
      DiskManager.computeFilePathInDir(
        'Qmdirhash',
        'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
      )
    } catch (e) {
      assert.ok(
        e.message.includes(
          'Please pass in a valid cid to computeFilePathInDir for dirName and fileName'
        )
      )
    }
  })

  /**
   * extractCIDsFromFSPath
   */
  it('Should pass if extractCIDsFromFSPath is passed in a directory and file', function () {
    const path =
      '/file_storage/files/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grouter/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grinner'
    const matchObj = DiskManager.extractCIDsFromFSPath(path)
    assert.deepStrictEqual(matchObj.isDir, true)
    assert.deepStrictEqual(
      matchObj.outer,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grouter'
    )
    assert.deepStrictEqual(
      matchObj.inner,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grinner'
    )
  })

  it('Should pass if extractCIDsFromFSPath is passed in just a file', function () {
    const path =
      '/file_storage/files/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grinner'
    const matchObj = DiskManager.extractCIDsFromFSPath(path)
    assert.deepStrictEqual(matchObj.isDir, false)
    assert.deepStrictEqual(
      matchObj.outer,
      'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grinner'
    )
    assert.deepStrictEqual(matchObj.inner, null)
  })

  it('Should return null if extractCIDsFromFSPath is passed in no valid CID', function () {
    const path = '/file_storage/files/QMcidhere'
    const matchObj = DiskManager.extractCIDsFromFSPath(path)
    assert.deepStrictEqual(matchObj, null)
  })
})
