const DiskManager = require('./diskManager')
const assert = require('assert')
const config = require('./config')
const path = require('path')
const sinon = require('sinon')

describe('Test DiskManager', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

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
  it('Should pass if storagePath is correctly set', async function () {
    const tmpTrackArtifactPath = path.join(
      DiskManager.getConfigStoragePath(),
      'files',
      'tmp_track_artifacts'
    )
    assert.deepStrictEqual(
      tmpTrackArtifactPath,
      await DiskManager.getTmpTrackUploadArtifactsPath()
    )
  })

  /**
   * computeFilePath
   */
  it('Should pass if computeFilePath returns the correct path', async function () {
    const fullPath = await DiskManager.computeFilePath(
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

  it('Should fail if fileName is not passed into computeFilePath', async function () {
    try {
      await DiskManager.computeFilePath()
    } catch (e) {
      assert.ok(
        e.message.includes('Please pass in a valid cid to computeFilePath')
      )
    }
  })

  it(`Should fail if fileName doesn't contain the appropriate amount of characters`, async function () {
    try {
      await DiskManager.computeFilePath('asd')
    } catch (e) {
      assert.ok(
        e.message.includes('Please pass in a valid cid to computeFilePath')
      )
    }
  })

  it(`Should fail if fileName contains a slash`, async function () {
    try {
      await DiskManager.computeFilePath('/file_storage/asdf')
    } catch (e) {
      assert.ok(
        e.message.includes('Please pass in a valid cid to computeFilePath')
      )
    }
  })

  /**
   * computeFilePathInDir
   */
  it('Should pass if computeFilePathInDir returns the correct path', async function () {
    const fullPath = await DiskManager.computeFilePathInDir(
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

  it('Should fail if dirName and fileName are not passed into computeFilePathInDir', async function () {
    try {
      await DiskManager.computeFilePathInDir()
    } catch (e) {
      assert.ok(e.message.includes('Must pass in valid dirName and fileName'))
    }
  })

  it('Should fail if dirName or fileName are not a CID passed into computeFilePathInDir', async function () {
    try {
      await DiskManager.computeFilePathInDir(
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

  it('should list subdirectories in /file_storage/files', async function () {
    sandbox.stub(DiskManager, '_execShellCommand').resolves(`
    ${DiskManager.getConfigStoragePath()}/files
    ${DiskManager.getConfigStoragePath()}/files/d8A
    ${DiskManager.getConfigStoragePath()}/files/Pyx
    ${DiskManager.getConfigStoragePath()}/files/BJg
    ${DiskManager.getConfigStoragePath()}/files/nVU    
    `)

    const subdirectories = await DiskManager.listSubdirectoriesInFiles()

    assert.deepStrictEqual(subdirectories.length, 4)
    assert.deepStrictEqual(
      subdirectories[0],
      `${DiskManager.getConfigStoragePath()}/files/d8A`
    )
    assert.deepStrictEqual(
      subdirectories[1],
      `${DiskManager.getConfigStoragePath()}/files/Pyx`
    )
    assert.deepStrictEqual(
      subdirectories[2],
      `${DiskManager.getConfigStoragePath()}/files/BJg`
    )
    assert.deepStrictEqual(
      subdirectories[3],
      `${DiskManager.getConfigStoragePath()}/files/nVU`
    )
  })

  it('should list subdirectories in /file_storage/files', async function () {
    sandbox.stub(DiskManager, '_execShellCommand').resolves(`
    ${DiskManager.getConfigStoragePath()}/files/b8p
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmTDBbpR8CAjGWwyxYgNfsX8erUKXeySr5NCSG4eUgQMPg
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmbZbLbULdY43unyshauqt4tQTCQDagQsvRV177Zf1nwZQ
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmZANxdPEmNiE7Hvu7DnmYcGEWD44DXvt3d4ZrcZuJd32j
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmbfxoKEvpHTyEtn48bokMJmLxyjrAsJr9j8nmEYrRw2sa
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmZc3gcxU6LDakrkRfJpKQqo9dhHKPqS1z6HcQR1g5b8pt
    ${DiskManager.getConfigStoragePath()}/files/b8p/Qme5FtyLtu3gKMmzZD6XnTSpMq1NCx3vQmm9ErQwsVb8p1    
    `)

    const cids = await DiskManager.listNestedCIDsInFilePath(
      `${DiskManager.getConfigStoragePath()}/files/b8p`
    )

    assert.deepStrictEqual(cids.length, 6)
    assert.deepStrictEqual(
      cids[0],
      `QmTDBbpR8CAjGWwyxYgNfsX8erUKXeySr5NCSG4eUgQMPg`
    )
    assert.deepStrictEqual(
      cids[1],
      `QmbZbLbULdY43unyshauqt4tQTCQDagQsvRV177Zf1nwZQ`
    )
    assert.deepStrictEqual(
      cids[2],
      `QmZANxdPEmNiE7Hvu7DnmYcGEWD44DXvt3d4ZrcZuJd32j`
    )
    assert.deepStrictEqual(
      cids[3],
      `QmbfxoKEvpHTyEtn48bokMJmLxyjrAsJr9j8nmEYrRw2sa`
    )
    assert.deepStrictEqual(
      cids[4],
      `QmZc3gcxU6LDakrkRfJpKQqo9dhHKPqS1z6HcQR1g5b8pt`
    )
    assert.deepStrictEqual(
      cids[5],
      `Qme5FtyLtu3gKMmzZD6XnTSpMq1NCx3vQmm9ErQwsVb8p1`
    )
  })
})
