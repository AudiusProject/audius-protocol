var Ajv = require('ajv')

const TrackSchema = require('./schemas/trackSchema.json')
const UserSchema = require('./schemas/userSchema.json')

const TRACK_SCHEMA_TYPE = 'TrackSchema'
const USER_SCHEMA_TYPE = 'UserSchema'

class SchemaValidator {
  init () {
    this.ajv = new Ajv()

    /**
     * Fully formed schemas object looks like the below
     * {
     *   'TrackSchema': {
     *     schema: <schemaJSON>,
     *     validator: <compiled validator object
     *     validate: function // returns error if not validated correctly, otherwise null
     *   },
     *   'UserSchema': ...
     * }
     *
     * validate works like this `this.UserSchema.validate(userObj)`
     */
    this.schemas = {
      [TRACK_SCHEMA_TYPE]: {
        schema: TrackSchema
      },
      [USER_SCHEMA_TYPE]: {
        schema: UserSchema
      }
    }

    for (const schemaType in this.schemas) {
      try {
        const validator = this.ajv.compile(this.schemas[schemaType].schema)
        if (validator.errors) throw new Error(`Validation error during schema compilation: ${schemaType} ${validator.errors}`)
        else {
          this.schemas[schemaType].validator = validator
          this.schemas[schemaType].validate = (obj) => {
            var valid = validator(obj)
            if (!valid) throw new Error(`Validation failed with errors: ${JSON.stringify(validator.errors)}`)
          }
        }
      } catch (e) {
        throw new Error(`Error compiling schema: ${schemaType} ${e.message}`)
      }
    }
  }

  getSchemas () {
    return this.schemas
  }
}

module.exports = SchemaValidator
module.exports.trackSchemaType = TRACK_SCHEMA_TYPE
module.exports.userSchemaType = USER_SCHEMA_TYPE
