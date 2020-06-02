import json
import copy
import logging  # pylint: disable=C0302
from jsonschema import Draft7Validator, ValidationError
logger = logging.getLogger(__name__)

# https://app.quicktype.io/ -- JSON schema generator
class ModelValidator:
    '''
        {key: value} :
        {
            model (first letter uppercase): {
                model_schema: schema,
                field_schema: {
                    title: schema,
                    mood: schema,
                    ...
            },
                fields: [title, mood, ...]
            }
        }
    '''
    models_to_schema_and_fields_dict = {}

    @classmethod
    def validate(cls, to_validate, model, field=""):
        schema = cls.get_schema(field, model)
        validator = Draft7Validator(schema)

        try:
            found_invalid_field = False
            for error in sorted(validator.iter_errors(to_validate), key=str):
                found_invalid_field = True
                logger.warning('Error with {0} instance {1}: {2}'.format(model, to_validate, error.message))

            # if any error occurs, raise exception
            if found_invalid_field:
                raise ValidationError('Instance {0} is not proper'.format(to_validate))
        except ValidationError as e:
            raise e

    @classmethod
    def get_schema(cls, field, model):
        # If model is not present in dict, init its schema and its field subschemas
        if model not in cls.models_to_schema_and_fields_dict:
            cls.init_model_schemas(model)

        # If field is empty, return the entire model schema
        if field == "":
            return cls.models_to_schema_and_fields_dict[model]['model_schema']

        # Else, return the specified field schema
        return cls.models_to_schema_and_fields_dict[model]['field_schema'][field]

    @classmethod
    def init_model_schemas(cls, model):
        # Load in the model schema in /schemas
        model_filename = './src/schemas/' + model.lower() + '_schema.json'
        with open(model_filename) as f:
            schema = json.load(f)

        model_properties = {
            "model_schema": schema, # schema for the entire model
            "field_schema": {}, # schema for just a field in model
            "fields": schema['definitions'][model]['required'] # list of fields in model
        }

        cls.models_to_schema_and_fields_dict[model] = model_properties

        # Create all the subschemas for each individual field
        for field in model_properties['fields']:
            # Create a deep copy of the entire schema to generate a schema that only
            # validates one field of the entire model
            schema_copy = copy.deepcopy(schema)

            # Replace the properties value with just the field to validate against
            # This way, we are able to use one entire model schema and at runtime,
            # generate a new schema for just a field
            # ex. replace all properties of Track (blockhash, block, title, ...) with just 'title'
            field_to_validate_against = {field: schema_copy['definitions'][model]['properties'][field]}
            schema_copy['definitions'][model]['properties'] = field_to_validate_against
            schema_copy['definitions'][model]['required'] = [field]

            # Add field schema to dict
            cls.models_to_schema_and_fields_dict[model]['field_schema'][field] = schema_copy

        return schema

    # TODO: add another field in the class dict called 'default' and 'type' for each field so
    # there is no need to dig down the subschema for these properties
    
    @classmethod
    def get_field_default(cls, model, field):
        if model in cls.models_to_schema_and_fields_dict:
            field_schema = cls.models_to_schema_and_fields_dict[model]['field_schema'][field]
            return field_schema['definitions'][model]['properties'][field]['default']
        return None

    @classmethod
    def get_field_type(cls, model, field):
        if model in cls.models_to_schema_and_fields_dict:
            field_schema = cls.models_to_schema_and_fields_dict[model]['field_schema'][field]
            return field_schema['definitions'][model]['properties'][field]['type']
        return None
