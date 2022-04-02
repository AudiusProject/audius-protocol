const assert = require('assert')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const sinon = require('sinon')

const { FileHasher } = require('../src/utils')

const createRandomText = () => {
  return uuid.v4()
}

const createRandomTextFile = () => {
  const filePath = path.join(__dirname, './assets/random.txt')
  fs.writeFileSync(filePath, createRandomText())

  return filePath
}

describe('test FileHasher with randomized text content', () => {
  let randomText, filePath, randomTextFilePath

  before(() => {
    randomText = createRandomText()
    filePath = createRandomTextFile()
    randomTextFilePath = path.join(__dirname, './assets/random.txt')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('[random - generateNonImageCid] passing in improper content throws', async () => {
    try {
      await FileHasher.generateNonImageCid(randomText)
      throw new Error('passing in improper data should have failed')
    } catch (e) {
      assert.ok(e.toString().includes('Could not convert content into buffer'))
    }
  })

  it('[random - generateNonImageCid] if `hashImages()` errors, `generateNonImageCid()` throws', async () => {
    sinon.stub(FileHasher, 'hashNonImages').throws(new Error('failed to generate only hash'))

    try {
      await FileHasher.generateNonImageCid(randomTextFilePath)
      throw new Error('`generateNonImageCid` should throw if `hashNonImages` fails')
    } catch (e) {
      assert.ok(e.toString().includes('failed to generate only hash'))
    }
  })
})

describe('test FileHasher with static content', () => {
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
    const filePath = files[i].path

    it('[static - generateNonImageCid] passing in improper content throws', async () => {
      try {
        await FileHasher.generateNonImageCid('some static string')
        throw new Error('passing in improper data should have failed')
      } catch (e) {
        assert.ok(e.toString().includes('Could not convert content into buffer'))
      }
    })

    it('[static - generateNonImageCid] if `hashImages()` errors, `generateNonImageCid()` throws', async () => {
      sinon.stub(FileHasher, 'hashNonImages').throws(new Error('failed to generate only hash'))

      try {
        await FileHasher.generateNonImageCid(filePath)
        throw new Error('`generateNonImageCid` should throw if `hashNonImages` fails')
      } catch (e) {
        assert.ok(e.toString().includes('failed to generate only hash'))
      }
    })
  }
})
