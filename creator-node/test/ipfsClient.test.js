const assert = require('assert')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')

// const sinon = require('sinon')
const ipfsClient = require('../src/ipfsClient')
const ipfs = ipfsClient.ipfs
const ipfsLatest = ipfsClient.ipfsLatest

const createRandomText = () => {
  // return uuid.v4()
  return 'i love bts'
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

  it('ipfs.add() and ipfs.addFromFs() should return the same cid when adding the same content', async () => {
    const buffer = fs.readFileSync(randomTextFilePath)
    const ipfsAddResp = (await ipfs.add(buffer))[0].hash
    const ipfsAddFromFsResp = (await ipfs.addFromFs(randomTextFilePath))[0].hash

    assert.deepStrictEqual(ipfsAddResp, ipfsAddFromFsResp)
  })

  it('[buffer] ipfs.add() and ipfsLatest.add() should reutrn the same cid when adding the same content', async () => {
    const buffer = fs.readFileSync(randomTextFilePath)

    const ipfsAddResp = (await ipfs.add(buffer))[0].hash
    let ipfsLatestAddResp
    for await (const resp of ipfsLatest.add(buffer)) {
      ipfsLatestAddResp = `${resp.cid}`
    }
    assert.deepStrictEqual(ipfsAddResp, ipfsLatestAddResp)
  })

  // Fails. interesting.
  it('[readstream] ipfs.add() and ipfsLatest.add() should reutrn the same cid when adding the same content', async () => {
    const readstream1 = fs.createReadStream(randomTextFilePath)
    const readstream2 = fs.createReadStream(randomTextFilePath)

    const ipfsAddResp = (await ipfs.add(readstream1))[0].hash
    let ipfsLatestAddResp
    for await (const resp of ipfsLatest.add(readstream2)) {
      ipfsLatestAddResp = `${resp.cid}`
    }
    assert.deepStrictEqual(ipfsAddResp, ipfsLatestAddResp)
  })

  it('[ipfsAddWithTimeout] If the ipfs add fn takes over the timeout, throw an error', async () => {
    try {
      const fnThatTakes20Sec = () => { return new Promise((resolve, reject) => setTimeout(resolve, 20000, 'should not have succeeded with this promise')) }
      await ipfsClient.ipfsAddWithTimeout(fnThatTakes20Sec, randomText, {}, 2000)
      assert.fail('Should have not waited 20 seconds')
    } catch (e) {
      // If reached here, good
    }
  })

  it('[ipfsAddWithTimeout] If the ipfs add fn takes under the timeout, do not throw an error', async () => {
    try {
      const fnThatTakes1Sec = () => { return new Promise((resolve, reject) => setTimeout(resolve, 1000, 'should have succeeded with this promise')) }
      await ipfsClient.ipfsAddWithTimeout(fnThatTakes1Sec, randomText, {}, 2000)
    } catch (e) {
      console.error(e)
      assert.fail('Should not have failed when the fn takes under the input timeout')
    }
  })

  it('[ipfsSingleAddWrapper] passing in a Buffer should work', async () => {
    const buffer = Buffer.from(randomText)

    const ipfsAddResp = await ipfsClient.ipfsSingleAddWrapper(ipfs.add, buffer)
    const ipfsLatestAddResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest.add, buffer)
    const ipfsAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfs.add, buffer, {}, {}, true)
    const ipfsLatestAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest.add, buffer, {}, {}, true)

    console.log('buffer', {
      ipfsAddResp,
      ipfsLatestAddResp,
      ipfsAddWithDaemonResp,
      ipfsLatestAddWithDaemonResp
    })

    assert.deepStrictEqual(ipfsAddResp, ipfsLatestAddResp)
    assert.deepStrictEqual(ipfsAddWithDaemonResp, ipfsLatestAddWithDaemonResp)
    assert.deepStrictEqual(ipfsAddResp, ipfsAddWithDaemonResp)
  })

  it('[ipfsSingleAddWrapper] passing in a ReadStream should work', async () => {
    const readStream1 = fs.createReadStream(randomTextFilePath)
    const ipfsAddResp = await ipfsClient.ipfsSingleAddWrapper(ipfs.add, readStream1)

    const readStream2 = fs.createReadStream(randomTextFilePath)
    const ipfsLatestAddResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest.add, readStream2)

    const readStream3 = fs.createReadStream(randomTextFilePath)
    const ipfsAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfs.add, readStream3, {}, {}, true)

    const readStream4 = fs.createReadStream(randomTextFilePath)
    const ipfsLatestAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest.add, readStream4, { onlyHash: true }, {}, true)

    console.log('readstream', {
      ipfsAddResp,
      ipfsLatestAddResp,
      ipfsAddWithDaemonResp,
      ipfsLatestAddWithDaemonResp
    })

    assert.deepStrictEqual(ipfsAddResp, ipfsLatestAddResp)
    assert.deepStrictEqual(ipfsAddWithDaemonResp, ipfsLatestAddWithDaemonResp)
    assert.deepStrictEqual(ipfsAddResp, ipfsAddWithDaemonResp)
  })

  it('[ipfsSingleAddWrapper] passing in a source path should work', async () => {
    const pathToFile = path.join(__dirname, './assets/random.txt')

    const ipfsAddResp = await ipfsClient.ipfsSingleAddWrapper(ipfs.add, pathToFile)
    const ipfsLatestAddResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest.add, pathToFile)
    const ipfsAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfs.add, pathToFile, {}, {}, true)
    const ipfsLatestAddWithDaemonResp = await ipfsClient.ipfsSingleAddWrapper(ipfsLatest.add, pathToFile, {}, {}, true)

    console.log('source path', {
      ipfsAddResp,
      ipfsLatestAddResp,
      ipfsAddWithDaemonResp,
      ipfsLatestAddWithDaemonResp
    })
    assert.deepStrictEqual(ipfsAddResp, ipfsLatestAddResp)
    assert.deepStrictEqual(ipfsAddWithDaemonResp, ipfsLatestAddWithDaemonResp)
    assert.deepStrictEqual(ipfsAddResp, ipfsAddWithDaemonResp)
  })

  // it('[ipfsSingleAddWrapper] ipfs add and only hash fn should return the same thing', async () => {

  // })

  //   it('[ipfsMultipleAddWrapper] ipfs add and only hash fn should return the same thing', async () => {

  //   })
})
