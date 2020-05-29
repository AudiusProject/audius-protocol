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
        model_filename = './src/schemas/schema_' + model.lower() + '.json'
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
            # Create a deep copy of the entire schema
            field_schema = copy.deepcopy(schema)

            # Replace the properties value with just the field to validate against
            # This way, we are able to use one entire model schema and at runtime,
            # generate a new schema for just a field
            # ex. replace all properties of Track (blockhash, block, title, ...) with just 'title'
            field_to_validate_against = {field: field_schema['definitions'][model]['properties'][field]}
            field_schema['definitions'][model]['properties'] = field_to_validate_against
            field_schema['definitions'][model]['required'] = [field]

            # Add field schema to dict
            cls.models_to_schema_and_fields_dict[model]['field_schema'][field] = field_schema

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

# Creating a track with improper title and download fields
'''
    track = Track(
        blockhash=block30.blockhash,
        blocknumber=30,
        track_id=(latest_id[0] + 1),
        is_current=True,
        is_delete=False,
        owner_id=2,
        route_id='oh/idk',
        updated_at=datetime.datetime.today(),
        created_at=datetime.datetime.today(),
        is_unlisted=False,
        track_segments={"sopmethnig": "s"}, # improper
        mood="jsonschema", 
        title=1, # improper
        download="abc" # improper
    )
'''

# Validation response in models.py
'''
    [2020-05-29 21:15:43,939] {src.model_validator:36} (WARNING) - Error with Track instance {'track_segments': {'sopmethnig': 's'}}: {'sopmethnig': 's'} is not of type 'array'
    [2020-05-29 21:15:43,947] {src.models:193} (WARNING) - Error: Instance {'track_segments': {'sopmethnig': 's'}} is not proper
    Setting the default value None for field track_segments of type array
    [2020-05-29 21:15:43,948] {src.model_validator:36} (WARNING) - Error with Track instance {'title': 1}: 1 is not of type 'string'
    [2020-05-29 21:15:43,948] {src.models:193} (WARNING) - Error: Instance {'title': 1} is not proper
    Setting the default value None for field title of type string
    [2020-05-29 21:15:43,949] {src.model_validator:36} (WARNING) - Error with Track instance {'download': 'abc'}: 'abc' is not of type 'object'
    [2020-05-29 21:15:43,949] {src.models:193} (WARNING) - Error: Instance {'download': 'abc'} is not proper
    Setting the default value NULL for field download of type object
'''
