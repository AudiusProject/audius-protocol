const fs = require('fs-extra')
const assert = require('assert')
const config = require('./config')
const path = require('path')
const sinon = require('sinon')
const utils = require('./utils')
const DiskManager = require('./diskManager')
const {
  computeFilePathAndEnsureItExists,
  computeFilePathInDirAndEnsureItExists
} = require('../src/utils/fsUtils')

describe('Test DiskManager', function () {
  let sandbox
  beforeEach(function () {
    sandbox = sinon.createSandbox()
    // stub out this function which ensures the directory path exists to return true
    sandbox.stub(fs, 'mkdir').returns(true)
    config.set('storagePath', '/test_file_storage')
  })

  afterEach(function () {
    sandbox.restore()
    config.reset('storagePath')
  })

  before(function () {
    // stub out this function which ensures the directory path exists to return true
    utils.ensureDirPathExists = async () => true
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
   * computeFilePathAndEnsureItExists
   */
  it('Should pass if computeFilePathAndEnsureItExists returns the correct path', async function () {
    const fullPath = await computeFilePathAndEnsureItExists(
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

  it('Should fail if fileName is not passed into computeFilePathAndEnsureItExists', async function () {
    try {
      await computeFilePathAndEnsureItExists()
    } catch (e) {
      assert.ok(e.message.includes('Please pass in a valid cid'))
    }
  })

  it(`Should fail if fileName doesn't contain the appropriate amount of characters`, async function () {
    try {
      await computeFilePathAndEnsureItExists('asd')
    } catch (e) {
      assert.ok(e.message.includes('Please pass in a valid cid'))
    }
  })

  it(`Should fail if fileName contains a slash`, async function () {
    try {
      await computeFilePathAndEnsureItExists('/file_storage/asdf')
    } catch (e) {
      assert.ok(e.message.includes('Please pass in a valid cid'))
    }
  })

  /**
   * computeFilePathInDirAndEnsureItExists
   */
  it('Should pass if computeFilePathInDirAndEnsureItExists returns the correct path', async function () {
    const fullPath = await computeFilePathInDirAndEnsureItExists(
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

  it('Should fail if dirName and fileName are not passed into computeFilePathInDirAndEnsureItExists', async function () {
    try {
      await computeFilePathInDirAndEnsureItExists()
    } catch (e) {
      assert.ok(e.message.includes('Must pass in valid dirName and fileName'))
    }
  })

  it('Should fail if dirName or fileName are not a CID passed into computeFilePathInDirAndEnsureItExists', async function () {
    try {
      await computeFilePathInDirAndEnsureItExists(
        'Qmdirhash',
        'QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6'
      )
    } catch (e) {
      assert.ok(
        e.message.includes(
          'Please pass in a valid cid for dirName and fileName'
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

  it('Should pass if extractCIDsFromFSPath is passed in a directory and file with a legacy path', function () {
    const path =
      '/file_storage/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grouter/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grinner'
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

  it('Should pass if extractCIDsFromFSPath is passed in just a file with legacy path', function () {
    const path = '/file_storage/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3Grinner'
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
    sandbox.stub(utils, 'execShellCommand').resolves(`
    .
    ./d8A
    ./Pyx
    ./BJg
    ./nVU    
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
    sandbox.stub(utils, 'execShellCommand').resolves(`
    ${DiskManager.getConfigStoragePath()}/files/b8p
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmTDBbpR8CAjGWwyxYgNfsX8erUKXeySr5NCSG4eUgQMPg
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmbZbLbULdY43unyshauqt4tQTCQDagQsvRV177Zf1nwZQ
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmZANxdPEmNiE7Hvu7DnmYcGEWD44DXvt3d4ZrcZuJd32j
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmbfxoKEvpHTyEtn48bokMJmLxyjrAsJr9j8nmEYrRw2sa
    ${DiskManager.getConfigStoragePath()}/files/b8p/QmZc3gcxU6LDakrkRfJpKQqo9dhHKPqS1z6HcQR1g5b8pt
    ${DiskManager.getConfigStoragePath()}/files/b8p/Qme5FtyLtu3gKMmzZD6XnTSpMq1NCx3vQmm9ErQwsVb8p1    
    `)

    const cidsToFilePathMap = await DiskManager.listNestedCIDsInFilePath(
      `${DiskManager.getConfigStoragePath()}/files/b8p`
    )

    const cidsToFilePathMapExpectedValues = {
      QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp: `${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp`,
      QmTDBbpR8CAjGWwyxYgNfsX8erUKXeySr5NCSG4eUgQMPg: `${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmTDBbpR8CAjGWwyxYgNfsX8erUKXeySr5NCSG4eUgQMPg`,
      QmbZbLbULdY43unyshauqt4tQTCQDagQsvRV177Zf1nwZQ: `${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmbZbLbULdY43unyshauqt4tQTCQDagQsvRV177Zf1nwZQ`,
      QmZANxdPEmNiE7Hvu7DnmYcGEWD44DXvt3d4ZrcZuJd32j: `${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmZANxdPEmNiE7Hvu7DnmYcGEWD44DXvt3d4ZrcZuJd32j`,
      QmbfxoKEvpHTyEtn48bokMJmLxyjrAsJr9j8nmEYrRw2sa: `${DiskManager.getConfigStoragePath()}/files/b8p/QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp/QmbfxoKEvpHTyEtn48bokMJmLxyjrAsJr9j8nmEYrRw2sa`,
      QmZc3gcxU6LDakrkRfJpKQqo9dhHKPqS1z6HcQR1g5b8pt: `${DiskManager.getConfigStoragePath()}/files/b8p/QmZc3gcxU6LDakrkRfJpKQqo9dhHKPqS1z6HcQR1g5b8pt`,
      Qme5FtyLtu3gKMmzZD6XnTSpMq1NCx3vQmm9ErQwsVb8p1: `${DiskManager.getConfigStoragePath()}/files/b8p/Qme5FtyLtu3gKMmzZD6XnTSpMq1NCx3vQmm9ErQwsVb8p1`
    }

    assert.deepStrictEqual(
      Object.keys(cidsToFilePathMapExpectedValues).length,
      7
    )
    assert.deepStrictEqual(
      cidsToFilePathMap.QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp,
      cidsToFilePathMapExpectedValues.QmWdtzxDfYad29vNcPTnZCacLTEry3QTUw5fjmyQuDb8pp
    )
    assert.deepStrictEqual(
      cidsToFilePathMap.QmTDBbpR8CAjGWwyxYgNfsX8erUKXeySr5NCSG4eUgQMPg,
      cidsToFilePathMapExpectedValues.QmTDBbpR8CAjGWwyxYgNfsX8erUKXeySr5NCSG4eUgQMPg
    )
    assert.deepStrictEqual(
      cidsToFilePathMap.QmbZbLbULdY43unyshauqt4tQTCQDagQsvRV177Zf1nwZQ,
      cidsToFilePathMapExpectedValues.QmbZbLbULdY43unyshauqt4tQTCQDagQsvRV177Zf1nwZQ
    )
    assert.deepStrictEqual(
      cidsToFilePathMap.QmZANxdPEmNiE7Hvu7DnmYcGEWD44DXvt3d4ZrcZuJd32j,
      cidsToFilePathMapExpectedValues.QmZANxdPEmNiE7Hvu7DnmYcGEWD44DXvt3d4ZrcZuJd32j
    )
    assert.deepStrictEqual(
      cidsToFilePathMap.QmbfxoKEvpHTyEtn48bokMJmLxyjrAsJr9j8nmEYrRw2sa,
      cidsToFilePathMapExpectedValues.QmbfxoKEvpHTyEtn48bokMJmLxyjrAsJr9j8nmEYrRw2sa
    )
    assert.deepStrictEqual(
      cidsToFilePathMap.QmZc3gcxU6LDakrkRfJpKQqo9dhHKPqS1z6HcQR1g5b8pt,
      cidsToFilePathMapExpectedValues.QmZc3gcxU6LDakrkRfJpKQqo9dhHKPqS1z6HcQR1g5b8pt
    )
    assert.deepStrictEqual(
      cidsToFilePathMap.Qme5FtyLtu3gKMmzZD6XnTSpMq1NCx3vQmm9ErQwsVb8p1,
      cidsToFilePathMapExpectedValues.Qme5FtyLtu3gKMmzZD6XnTSpMq1NCx3vQmm9ErQwsVb8p1
    )
  })
})
