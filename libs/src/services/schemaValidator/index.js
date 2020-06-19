// var Ajv = require('ajv')
var validate = require('jsonschema').validate

const TrackSchema = require('./schemas/trackSchema.json')
const UserSchema = require('./schemas/userSchema.json')

const TRACK_SCHEMA_TYPE = 'TrackSchema'
const USER_SCHEMA_TYPE = 'UserSchema'

class SchemaValidator {
  init () {
    let start = Date.now()
    // this.ajv = new Ajv({ useDefaults: "empty" })

    /**
     * Fully formed schemas object looks like the below
     * {
     *   'TrackSchema': {
     *     schema: <schemaJSON>,
     *     validator: <compiled validator object>
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
      this.schemas[schemaType].validate = (obj) => {
        console.log(this.schemas[schemaType].schema, 'inside validate')
        // var valid = validator(obj)
        
        const result = validate(obj, this.schemas[schemaType].schema)
        if (result.errors.length > 0) throw new Error(`${schemaType} validation failed with errors: ${JSON.stringify(result.errors)}`)
        // if (result.errors.length > 0){
        //   try {
        //     this.fixValidationErrors(result.errors, obj, this.schemas[schemaType].schema)
        //   } catch (e) {
        //     throw new Error(`${schemaType} validation failed with errors: ${JSON.stringify(result.errors)}`)
        //   }
        // }
        // else console.log("Validation successful", result)
      }
    }
    console.log("validator elapsed", Date.now()-start)
  }

  getSchemas () {
    return this.schemas
  }

  // fixValidationErrors (errors, obj, schema) {
  //   // 
  //   const definitionPath = schema.$ref.split('/').slice(-1)[0]
  //   // for (const e in errors){
  //   //   switch (e.name) {
  //   //     case value:
          
  //   //       break;
      
  //   //     default:
  //   //       break;
  //   //   }
  //   // }
  // }
}

module.exports = SchemaValidator
module.exports.trackSchemaType = TRACK_SCHEMA_TYPE
module.exports.userSchemaType = USER_SCHEMA_TYPE
