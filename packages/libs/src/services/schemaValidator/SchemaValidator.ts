import { validate } from 'jsonschema'

import PlaylistSchema from './schemas/playlistSchema.json'
import TrackSchema from './schemas/trackSchema.json'
import UserSchema from './schemas/userSchema.json'

export const trackSchemaType = 'TrackSchema'
export const userSchemaType = 'UserSchema'
export const playlistSchemaType = 'PlaylistSchema'

type SchemaConfig = {
  schema: {
    definitions: Record<
      string,
      | { required: string[]; properties: Record<string, { default: unknown }> }
      | {}
    >
  }
  baseDefinition: string
  validate?: (obj: Record<string, unknown>) => void
}

type SchemaType =
  | typeof trackSchemaType
  | typeof userSchemaType
  | typeof playlistSchemaType

export type Schemas = {
  TrackSchema: SchemaConfig
  UserSchema: SchemaConfig
  PlaylistSchema: SchemaConfig
}

export class SchemaValidator {
  schemas: Schemas | undefined

  init() {
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
      [trackSchemaType]: {
        schema: TrackSchema,
        baseDefinition: 'Track'
      },
      [userSchemaType]: {
        schema: UserSchema,
        baseDefinition: 'User'
      },
      [playlistSchemaType]: {
        schema: PlaylistSchema,
        baseDefinition: 'Playlist'
      }
    }

    for (const schemaType in this.schemas) {
      const typedSchemaType = schemaType as SchemaType
      this.schemas[typedSchemaType].validate = (
        obj: Record<string, unknown>
      ) => {
        this.addMissingFields(obj, typedSchemaType)

        const result = validate(obj, this.schemas?.[typedSchemaType].schema)
        if (result.errors.length > 0)
          throw new Error(
            `${schemaType} validation failed with errors: ${JSON.stringify(
              result.errors
            )}`
          )
      }
    }
  }

  getSchemas() {
    return this.schemas
  }

  addMissingFields(obj: Record<string, unknown>, schemaType: SchemaType) {
    if (!this.schemas) {
      return
    }
    // schema is the entire imporoted schema, including all the definitions for JSON fields
    const { schema, baseDefinition } = this.schemas[schemaType]
    // schemaTypeObj is only the subset of the schema with only one definition for main schema type
    const schemaTypeObj = schema.definitions[baseDefinition]
    // iterate through every required property, ensuring it exists or setting a default value
    if (schemaTypeObj && 'required' in schemaTypeObj) {
      schemaTypeObj.required.forEach((req) => {
        if (!Object.prototype.hasOwnProperty.call(obj, req)) {
          if (
            Object.prototype.hasOwnProperty.call(
              schemaTypeObj.properties[req],
              'default'
            )
          ) {
            obj[req] = schemaTypeObj.properties[req]?.default
          } else
            throw new Error(
              `Could not set default value for missing field ${req}`
            )
        }
      })
    }
  }
}
