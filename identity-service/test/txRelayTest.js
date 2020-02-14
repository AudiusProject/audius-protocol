const assert = require('assert')
// const request = require('supertest')
const config = require('../src/config')
// const txRelay = require('../src/txRelay')

// const { getApp } = require('./lib/app')

describe('test txRelay functions', function () {
  // let app, server

  // beforeEach(async () => {
  //   const appInfo = await getApp(null, null)
  //   app = appInfo.app
  //   server = appInfo.server
  // })

  // afterEach(async () => {
  //   await server.close()
  // })

  it('env key and object key names are equal', function () {
    const schema = config.getSchema().properties

    for (var key in schema) {
      assert(key === schema[key]['env'], `The key ${key} and the env key ${schema[key]['env']} do not match.`)
    }
  })

  // it('grabbing key, setting the value through env key, and ensuring the new value is the set value', function () {
  //   console.log('-------------------- properties')
  //   console.log(config.getProperties())
  //   console.log('-------------------- schema ')
  //   console.log(config.getSchema())
  //   console.log('-------------------- args')
  //   console.log(config.getArgs())
  //   console.log('-------------------- env')
  //   console.log(config.getEnv())
  //   // if (!config) {
  //   //     // if emp
  //   // }

  //   /*
  //     if config is empty, add key with env var

  //     grab one key (of 1 type) and update
  //   */
  // })
})
