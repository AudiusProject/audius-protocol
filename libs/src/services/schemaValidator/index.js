var validate = require('jsonschema').validate

const TrackSchema = require('./schemas/trackSchema.json')
const UserSchema = require('./schemas/userSchema.json')

const TRACK_SCHEMA_TYPE = 'TrackSchema'
const USER_SCHEMA_TYPE = 'UserSchema'

class SchemaValidator {
  init () {
    /**
     * Fully formed schemas object looks like the below
     * {
     *   'TrackSchema': {
     *     schema: <schemaJSON>,
     *     baseDefinition: 'String', //name of base definition property in schema
     *     validate: function // returns error if not validated correctly, otherwise null
     *   },
     *   'UserSchema': ...
     * }
     *
     * validate works like this `this.UserSchema.validate(userObj)`
     */
    this.schemas = {
      [TRACK_SCHEMA_TYPE]: {
        schema: TrackSchema,
        baseDefinition: 'Track'
      },
      [USER_SCHEMA_TYPE]: {
        schema: UserSchema,
        baseDefinition: 'User'
      }
    }

    for (const schemaType in this.schemas) {
      this.schemas[schemaType].validate = (obj) => {
        this.addMissingFields(obj, schemaType)

        const result = validate(obj, this.schemas[schemaType].schema)
        if (result.errors.length > 0) throw new Error(`${schemaType} validation failed with errors: ${JSON.stringify(result.errors)}`)
      }
    }
  }

  getSchemas () {
    return this.schemas
  }

  addMissingFields (obj, schemaType) {
    // schema is the entire imporoted schema, including all the definitions for JSON fields
    const { schema, baseDefinition } = this.schemas[schemaType]
    // schemaTypeObj is only the subset of the schema with only one definition for main schema type
    const schemaTypeObj = schema.definitions[baseDefinition]
    // iterate through every required property, ensuring it exists or setting a default value
    schemaTypeObj.required.forEach((req) => {
      if (!obj.hasOwnProperty(req)) {
        if (schemaTypeObj.properties[req].hasOwnProperty('default')) {
          obj[req] = schemaTypeObj.properties[req].default
        } else throw new Error(`Could not set default value for missing field ${req}`)
      }
    })
  }
}

module.exports = SchemaValidator
module.exports.trackSchemaType = TRACK_SCHEMA_TYPE
module.exports.userSchemaType = USER_SCHEMA_TYPE
