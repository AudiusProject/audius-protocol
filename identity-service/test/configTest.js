const assert = require('assert')
const config = require('../src/config')
const { generateRandomUUID, generateRandomPort, generateRandomNaturalNumber, generateRandomBoolean, generateRandomLogLevel } = require('./lib/generateRandomValues')
const convict = require('convict')

describe('test txRelay functions', function () {
  it('env key and object key names are equal', function () {
    const schema = config.getSchema().properties

    for (var key in schema) {
      assert(key === schema[key]['env'], `The key ${key} and the env key ${schema[key]['env']} do not match.`)
    }
  })

  it('[pass] Adding a number with format as type string will cause config to take its string value', function () {
    const c = convict({
      randomKey: {
        format: String,
        default: null,
        env: 'randomKey'
      }
    })

    process.env['randomKey'] = 123
    assert(process.env['randomKey'] === '123')

    c.load({})

    assert(c.get('randomKey') === '123')

    try {
      c.validate()
    } catch (e) {
      assert.fail(e)
    }
  })

  it('[pass] Adding a number with format as type nat will cause config to take its numeric value', function () {
    const c = convict({
      randomKey: {
        format: 'nat',
        default: null,
        env: 'randomKey'
      }
    })

    process.env['randomKey'] = '123'

    c.load({})

    assert(c.get('randomKey') === 123)

    try {
      c.validate()
    } catch (e) {
      assert.fail(e)
    }
  })

  it('setting a value through env key, and ensuring the new value is set in config', function () {
    const schema = config.getSchema().properties

    for (var key in schema) {
      let oldValue = config.get(key)
      let newValue

      let format = schema[key].format.toString()

      // setting invalid values
      newValue = getBadValue(format, newValue)

      if (newValue) {
        setAndValidateEnvVar(key, newValue)

        // Reload config to grab env vars
        config.load({})

        assert.throws(() => {
          config.validate()
          assert.fail('Did not properly validate config')
        }, Error)
      }

      newValue = getValidValue(format, newValue)

      setAndValidateEnvVar(key, newValue)

      config.load({})

      // convict js converts env vars to its proper type
      assert(config.get(key) === newValue, `The config with format type '${schema[key].format}' is still retaining its
        old value of '${oldValue}' instead of '${newValue}'`)
    }
  })
})

// Retrieves proper values for validation tests
function getValidValue (format, newValue) {
  switch (format) {
    case 'fatal,error,warn,info,debug,trace':
      newValue = generateRandomLogLevel()
      break
    case 'string':
      newValue = generateRandomUUID()
      break
    case 'number':
    case 'nat':
      newValue = generateRandomNaturalNumber()
      break
    // port types in convict are converted to strings
    case 'port':
      newValue = generateRandomPort()
      break
    case 'boolean':
      newValue = generateRandomBoolean()
  }
  return newValue
}

// Retrieves bad values for validation tests
function getBadValue (format, newValue) {
  switch (format) {
    case 'fatal,error,warn,info,debug,trace':
      newValue = generateRandomNaturalNumber()
      break
    case 'nat':
      newValue = generateRandomUUID()
      break
    case 'port':
      newValue = generateRandomUUID()
      break
    // A format of type string will convert any newValue to its string value
    // A format of type boolean will convert any newValue to its t/f value
    // A format of type number will convert any newValue to NaN, which is a type of number
    case 'string':
    case 'boolean':
    case 'number':
      console.log('Skipping....')
      break
  }
  return newValue
}

// Sets and validates env var
function setAndValidateEnvVar (key, newValue) {
  process.env[key] = newValue

  // everything in process.env is typeof string
  assert(process.env[key] === newValue.toString(), 'Env var was not set properly.')
}
