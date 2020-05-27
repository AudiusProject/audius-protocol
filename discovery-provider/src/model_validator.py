import json
# import logging  # pylint: disable=C0302
from jsonschema import validate, Draft7Validator, ValidationError, validators

# logger = logging.getLogger(__name__)

# https://app.quicktype.io/ -- JSON schema generator
class ModelValidator:
    # <model: {fields: [], schema: object}>
    schema_and_fields_dict = {}

    @staticmethod
    def init_schema(model):
         # If validation schema has been loaded before, refer to dict
        if model in ModelValidator.schema_and_fields_dict:
            schema = ModelValidator.schema_and_fields_dict[model]['schema']
        else:
            model_filename = './src/schema_' + model + '_simple_oneof.json'
            with open(model_filename) as f:
                schema = json.load(f)

            ModelValidator.schema_and_fields_dict[model] = {"fields": schema['fields'], "schema": schema}

        return schema


    @classmethod
    def validate(cls, instance, model):
        try:
            schema = cls.init_schema('track')
            validator = Draft7Validator(schema)

            # validate each field & lazy print each error if error exists
            found_invalid_field = False
            for error in sorted(validator.iter_errors(instance), key=str):
                found_invalid_field = True
                print(error.message)

            # if any error occurs, raise exception
            if found_invalid_field:
                raise ValidationError('Instance {0} is not proper'.format(instance))
        except ValidationError as e:
            raise e

# Example use case

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
        track_segments={"sopmethnig": "s"},
        title=1,
        download="abc"
    )
'''

# Validation response in models.py
'''
    [2020-05-27 05:55:20,532] {src.models:176} (WARNING) - Error: Instance {'title': 1} is not proper
    Setting the default value None for field title
    [2020-05-27 05:55:20,536] {src.models:176} (WARNING) - Error: Instance {'download': 'abc'} is not proper
    Setting the default value None for field download
'''
