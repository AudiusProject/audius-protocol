const assert = require('assert')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const sinon = require('sinon')

const ipfsClient = require('../src/ipfsClient')
const ipfsAdd = require('../src/ipfsAdd')

const ipfs = ipfsClient.ipfs
const ipfsLatest = ipfsClient.ipfsLatest

const createRandomText = () => {
  return uuid.v4()
}

const createRandomTextFile = () => {
  const filePath = path.join(__dirname, './assets/random.txt')
  fs.writeFileSync(filePath, createRandomText())

  return filePath
}

describe('test ipfsClient with randomized text content', () => {
  let randomText, filePath, randomTextFilePath

  before(() => {
    randomText = createRandomText()
    filePath = createRandomTextFile()
    randomTextFilePath = path.join(__dirname, './assets/random.txt')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('[random - buffer] when adding a buffer, the cids should be consistent', async () => {
    const buffer = fs.readFileSync(filePath)

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
    const onlyHash = await ipfsAdd.ipfsOnlyHashNonImages(buffer)

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

  it('[random - readstream] when adding a readstream, the cids should be consistent', async () => {
    // Original IPFS instance
    const ipfsAddReadstreamResp = (await ipfs.add(fs.createReadStream(filePath)))[0].hash

    // Original IPFS instance with `onlyHash` flag
    const ipfsAddReadstreamRespOnlyHashFlag = (await ipfs.add(fs.createReadStream(randomTextFilePath), { onlyHash: true }))[0].hash

    // Newer IPFS instance
    let ipfsLatestAddReadstreamResp
    for await (const resp of ipfsLatest.add(fs.createReadStream(randomTextFilePath))) {
      ipfsLatestAddReadstreamResp = `${resp.cid}`
    }

    // Newer IPFS instance with `onlyHash` flag
    let ipfsLatestAddReadstreamRespWithOnlyHashFlag
    for await (const resp of ipfsLatest.add(fs.createReadStream(randomTextFilePath), { onlyHash: true })) {
      ipfsLatestAddReadstreamRespWithOnlyHashFlag = `${resp.cid}`
    }

    // Only hash logic
    const onlyHash = await ipfsAdd.ipfsOnlyHashNonImages(fs.createReadStream(randomTextFilePath))

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
  it('[random - file path] when adding a file path, the cids should be consistent', async () => {
    // Original IPFS instance
    const ipfsAddFromFsFilePathResp = (await ipfs.addFromFs(randomTextFilePath))[0].hash

    // Original IPFS instance with `onlyHash` flag
    const ipfsAddFromFsFilePathRespOnlyHashFlag = (await ipfs.addFromFs(randomTextFilePath, { onlyHash: true }))[0].hash

    // Only hash logic
    const buffer = await fs.readFileSync(randomTextFilePath)
    const onlyHash = await ipfsAdd.ipfsOnlyHashNonImages(buffer)

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

  it('[random - generateNonImageMultihashes] passing in improper content throws', async () => {
    try {
      await ipfsAdd.generateNonImageMultihashes(randomText)
      throw new Error('passing in improper data should have failed')
    } catch (e) {
      assert.ok(e.toString().includes('Could not convert content into buffer'))
    }
  })

  it('[random - generateNonImageMultihashes] if `ipfsOnlyHashImages()` errors, `generateNonImageMultihashes()` throws', async () => {
    sinon.stub(ipfsAdd, 'ipfsOnlyHashNonImages').throws(new Error('failed to generate only hash'))

    try {
      await ipfsAdd.generateNonImageMultihashes(randomTextFilePath)
      throw new Error('`generateNonImageMultihashes` should throw if `ipfsOnlyHashNonImages` fails')
    } catch (e) {
      assert.ok(e.toString().includes('failed to generate only hash'))
    }
  })
})

describe('test ipfsClient with static content', () => {
  const staticTextPath = path.join(__dirname, './assets/static_text.txt')
  const staticImagePath = path.join(__dirname, './assets/static_image.png')

  const files = [
    // index 0 - static text
    {
      type: 'text',
      path: staticTextPath,
      buffer: fs.readFileSync(staticTextPath),
      cid: 'QmNXk37dMvg8QYhy2S8AtV8stQRDCL91ybCretxFK8R4Yd'
    },
    // index 1 - static image
    {
      type: 'image',
      path: staticImagePath,
      buffer: fs.readFileSync(staticImagePath),
      cid: 'QmQzgdAxHH2jsthbwHg6mGonniu2quqJPYNankGUK2Sn8a'
    }
  ]

  afterEach(() => {
    sinon.restore()
  })

  for (let i = 0; i < files.length; i++) {
    const type = files[i].type
    const buffer = files[i].buffer
    const filePath = files[i].path
    const expectedCID = files[i].cid

    it(`[static - buffer] when adding a(n) ${type} buffer, the cids should be consistent`, async () => {
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
      const onlyHash = await ipfsAdd.ipfsOnlyHashNonImages(buffer)

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

      for (let j = 0; j < allResults.length; j++) {
        assert.deepStrictEqual(allResults[j], expectedCID)
      }
    })

    it(`[static - readstream] when adding a(n) ${type} readstream, the cids should be consistent`, async () => {
      // Original IPFS instance
      const ipfsAddReadstreamResp = (await ipfs.add(fs.createReadStream(filePath)))[0].hash

      // Original IPFS instance with `onlyHash` flag
      const ipfsAddReadstreamRespOnlyHashFlag = (await ipfs.add(fs.createReadStream(filePath), { onlyHash: true }))[0].hash

      // Newer IPFS instance
      let ipfsLatestAddReadstreamResp
      for await (const resp of ipfsLatest.add(fs.createReadStream(filePath))) {
        ipfsLatestAddReadstreamResp = `${resp.cid}`
      }

      // Newer IPFS instance with `onlyHash` flag
      let ipfsLatestAddReadstreamRespWithOnlyHashFlag
      for await (const resp of ipfsLatest.add(fs.createReadStream(filePath), { onlyHash: true })) {
        ipfsLatestAddReadstreamRespWithOnlyHashFlag = `${resp.cid}`
      }

      // Only hash logic
      const onlyHash = await ipfsAdd.ipfsOnlyHashNonImages(fs.createReadStream(filePath))

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

      for (let j = 0; j < allResults.length; j++) {
        assert.deepStrictEqual(allResults[j], expectedCID)
      }
    })

    it(`[static - file path] when adding a(n) ${type} file path, the cids should be consistent`, async () => {
      // Original IPFS instance
      const ipfsAddFromFsFilePathResp = (await ipfs.addFromFs(filePath))[0].hash

      // Original IPFS instance with `onlyHash` flag
      const ipfsAddFromFsFilePathRespOnlyHashFlag = (await ipfs.addFromFs(filePath, { onlyHash: true }))[0].hash

      // Only hash logic
      const buffer = await fs.readFileSync(filePath)
      const onlyHash = await ipfsAdd.ipfsOnlyHashNonImages(buffer)

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

      for (let j = 0; j < allResults.length; j++) {
        assert.deepStrictEqual(allResults[j], expectedCID)
      }
    })

    it('[static - generateNonImageMultihashes] passing in improper content throws', async () => {
      try {
        await ipfsAdd.generateNonImageMultihashes('vicky was here hehe')
        throw new Error('passing in improper data should have failed')
      } catch (e) {
        assert.ok(e.toString().includes('Could not convert content into buffer'))
      }
    })

    it('[static - generateNonImageMultihashes] if `ipfsOnlyHashImages()` errors, `generateNonImageMultihashes()` throws', async () => {
      sinon.stub(ipfsAdd, 'ipfsOnlyHashNonImages').throws(new Error('failed to generate only hash'))

      try {
        await ipfsAdd.generateNonImageMultihashes(filePath)
        throw new Error('`generateNonImageMultihashes` should throw if `ipfsOnlyHashNonImages` fails')
      } catch (e) {
        assert.ok(e.toString().includes('failed to generate only hash'))
      }
    })
  }
})
