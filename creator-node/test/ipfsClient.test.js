const assert = require('assert')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')

// const sinon = require('sinon')
const ipfsClient = require('../src/ipfsClient')
const ipfs = ipfsClient.ipfs
const ipfsLatest = ipfsClient.ipfsLatest

const createRandomText = () => {
  return uuid.v4()
}

// TODO: IF THE LGOGER EVER PRINTS OUT AN ERROR -> FAIL TEST IF NOT INTENTIONAL

const createRandomTextFile = () => {
  const filePath = path.join(__dirname, './assets/random.txt')
  fs.writeFileSync(filePath, createRandomText())

  return filePath
}

describe('test ipfsClient', () => {
  let randomText, randomTextFilePath

  before(() => {
    randomText = createRandomText()
    randomTextFilePath = createRandomTextFile()
  })

  // TEST IPFS ADD

  it('[buffer] when adding a buffer, the cids should be consistent', async () => {
    const buffer = fs.readFileSync(randomTextFilePath)

    // Original IPFS instance
    const ipfsAddBufferResp = (await ipfs.add(buffer))[0].hash

    // Original IPFS instance with `onlyHash` flag
    const ipfsAddBufferRespOnlyHashFlag = (await ipfs.add(buffer, { onlyHash: true }))[0].hash

    // Newer IPFS instance
    let ipfsLatestAddBufferResp
    for await (const resp of ipfsLatest.add(buffer)) {
      ipfsLatestAddBufferResp = `${resp.cid}`
    }

    // Newer IPFS instance with `onlyHash` flag
    let ipfsLatestAddBufferRespWithOnlyHashFlag
    for await (const resp of ipfsLatest.add(buffer, { onlyHash: true })) {
      ipfsLatestAddBufferRespWithOnlyHashFlag = `${resp.cid}`
    }

    // Only hash logic
    const onlyHash = await ipfsClient.ipfsAddWithoutDaemon(buffer)

    console.log('buffers', {
      ipfsAddBufferResp,
      ipfsAddBufferRespOnlyHashFlag,
      ipfsLatestAddBufferResp,
      ipfsLatestAddBufferRespWithOnlyHashFlag,
      onlyHash
    })

    const allResults = [
      ipfsAddBufferResp,
      ipfsAddBufferRespOnlyHashFlag,
      ipfsLatestAddBufferResp,
      ipfsLatestAddBufferRespWithOnlyHashFlag,
      onlyHash
    ]

    assert.ok(!!allResults.reduce(function (a, b) { return (a === b) ? a : NaN }))
  })

  it('[readstream] when adding a readstream, the cids should be consistent', async () => {
    const readstream1 = fs.createReadStream(randomTextFilePath)
    const readstream2 = fs.createReadStream(randomTextFilePath)
    const readstream3 = fs.createReadStream(randomTextFilePath)
    const readstream4 = fs.createReadStream(randomTextFilePath)
    const readstream5 = fs.createReadStream(randomTextFilePath)

    // Original IPFS instance
    const ipfsAddReadstreamResp = (await ipfs.add(readstream1))[0].hash

    // Original IPFS instance with `onlyHash` flag
    const ipfsAddReadstreamRespOnlyHashFlag = (await ipfs.add(readstream2, { onlyHash: true }))[0].hash

    // Newer IPFS instance
    let ipfsLatestAddReadstreamResp
    for await (const resp of ipfsLatest.add(readstream3)) {
      ipfsLatestAddReadstreamResp = `${resp.cid}`
    }

    // Newer IPFS instance with `onlyHash` flag
    let ipfsLatestAddReadstreamRespWithOnlyHashFlag
    for await (const resp of ipfsLatest.add(readstream4, { onlyHash: true })) {
      ipfsLatestAddReadstreamRespWithOnlyHashFlag = `${resp.cid}`
    }

    // Only hash logic
    const onlyHash = await ipfsClient.ipfsAddWithoutDaemon(readstream5)

    console.log('readstream', {
      ipfsAddReadstreamResp,
      ipfsAddReadstreamRespOnlyHashFlag,
      ipfsLatestAddReadstreamResp,
      ipfsLatestAddReadstreamRespWithOnlyHashFlag,
      onlyHash
    })

    // NOTE: we have observed that passing in a readstream to ipfs.add is inconsistent.
    // Commenting out ipfs.add responses in test result comparisons
    const allResults = [
      // ipfsAddReadstreamResp,
      // ipfsAddReadstreamRespOnlyHashFlag,
      ipfsLatestAddReadstreamResp,
      ipfsLatestAddReadstreamRespWithOnlyHashFlag,
      onlyHash
    ]

    // Check that every response in `allResults` is equal to each other
    assert.ok(!!allResults.reduce(function (a, b) { return (a === b) ? a : NaN }))
  })

  // Note: ipfsLatest does not have a `addFromFs()` fn
  it('[file path] when adding a file path, the cids should be consistent', async () => {
    // Original IPFS instance
    const ipfsAddFromFsFilePathResp = (await ipfs.addFromFs(randomTextFilePath))[0].hash

    // Original IPFS instance with `onlyHash` flag
    const ipfsAddFromFsFilePathRespOnlyHashFlag = (await ipfs.addFromFs(randomTextFilePath, { onlyHash: true }))[0].hash

    // Only hash logic -- used in conjunction with convert to buffer fn
    const buffer = await ipfsClient._convertToBuffer(randomTextFilePath)
    const onlyHash = await ipfsClient.ipfsAddWithoutDaemon(buffer)

    console.log('file path', {
      ipfsAddFromFsFilePathResp,
      ipfsAddFromFsFilePathRespOnlyHashFlag,
      onlyHash
    })

    const allResults = [
      ipfsAddFromFsFilePathResp,
      ipfsAddFromFsFilePathRespOnlyHashFlag,
      onlyHash
    ]

    assert.ok(!!allResults.reduce(function (a, b) { return (a === b) ? a : NaN }))
  })

  it('[ipfsSingleAddWrapper] passing in a Buffer should work', async () => {
    const buffer = Buffer.from(randomText)

    const onlyHash = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest, buffer)
    const ipfsLatestAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest, buffer, {}, {}, true)

    console.log('buffer', {
      onlyHash,
      ipfsLatestAddWithDaemonResp
    })

    assert.deepStrictEqual(onlyHash, ipfsLatestAddWithDaemonResp)
  })

  it('[ipfsSingleAddWrapper] passing in a ReadStream should work', async () => {
    const readStream1 = fs.createReadStream(randomTextFilePath)
    const onlyHash = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest, readStream1)

    const readStream2 = fs.createReadStream(randomTextFilePath)
    const ipfsLatestAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest, readStream2, {}, {}, true)

    console.log('readstream', {
      onlyHash,
      ipfsLatestAddWithDaemonResp
    })

    assert.deepStrictEqual(onlyHash, ipfsLatestAddWithDaemonResp)
  })

  it('[ipfsSingleAddWrapper] passing in a source path should work', async () => {
    const pathToFile = path.join(__dirname, './assets/random.txt')

    const onlyHash = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest, pathToFile)
    const ipfsLatestAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest, pathToFile, {}, {}, true)

    console.log('source path', {
      onlyHash,
      ipfsLatestAddWithDaemonResp
    })

    assert.deepStrictEqual(onlyHash, ipfsLatestAddWithDaemonResp)
  })
})
