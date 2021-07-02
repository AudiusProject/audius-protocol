import os.path
import json
import copy
import logging  # pylint: disable=C0302
from jsonschema import Draft7Validator, ValidationError, SchemaError

logger = logging.getLogger(__name__)

# https://app.quicktype.io/ -- JSON schema generator
class ModelValidator:
    """
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
    """

    models_to_schema_and_fields_dict = {}
    BASE_PATH = "./src/schemas/"
    FILE_NAME = ""

    # Default field is set to None to validate the entire model
    @classmethod
    def validate(cls, to_validate, model, field=None):
        cls.FILE_NAME = model.lower() + "_schema.json"
        try:
            schema = cls.get_schema_for_field(field, model)
            validator = Draft7Validator(schema)

            found_invalid_field = False
            errors = []
            for error in sorted(validator.iter_errors(to_validate), key=str):
                found_invalid_field = True
                errors.append(error.message)

            if found_invalid_field:
                raise ValidationError(
                    f"Instance {to_validate} is not proper. Errors: {errors}"
                )

        except ValidationError as ve:
            raise ve
        except SchemaError as se:
            raise se
        except BaseException as e:
            # one of many errors specified in helper methods
            raise e

    # If field is None, return the entire model schema
    @classmethod
    def get_schema_for_field(cls, field, model):
        try:
            # If model is not present in dict, init its schema and its field subschemas
            if model not in cls.models_to_schema_and_fields_dict:
                schema = cls.init_model_schemas(model)
                if not schema:
                    error_msg = f"ModelValidation failed. Are you sure the schema for {model} is present and proper?"
                    raise RuntimeError(error_msg)

            if field == None:
                return cls.models_to_schema_and_fields_dict[model]["model_schema"]

            # Else, return the specified field schema
            return cls.models_to_schema_and_fields_dict[model]["field_schema"][field]
        except BaseException as e:
            raise e

    @classmethod
    def init_model_schemas(cls, model):
        cls.FILE_NAME = model.lower() + "_schema.json"
        try:
            # Load in the model schema in /schemas
            schema = cls.load_schema_from_path(model)

            model_properties = {
                "model_schema": schema,  # schema for the entire model
                "field_schema": {},  # schema for just a field in model
                "fields": cls._get_required(schema, model),  # list of fields in model
            }

            cls.models_to_schema_and_fields_dict[model] = model_properties

            # Create all the subschemas for each individual field
            for field in model_properties["fields"]:
                # Create a deep copy of the entire schema to generate a schema that only
                # validates one field of the entire model
                cls.create_field_schema(schema, field, model)

            return schema
        except BaseException as e:
            logger.exception(e)
            return None

    @classmethod
    def load_schema_from_path(cls, model):
        schema_path = cls.BASE_PATH + cls.FILE_NAME

        if not os.path.isfile(schema_path):
            raise FileNotFoundError(
                f"Schema for {model} not found in path {schema_path}"
            )

        with open(schema_path) as f:
            try:
                schema = json.load(f)
                return schema
            except json.JSONDecodeError as je:
                raise je

    @classmethod
    def create_field_schema(cls, schema, field, model):
        try:
            # Create a deep copy of the entire schema to generate a schema that only
            # validates one field of the entire model
            schema_copy = copy.deepcopy(schema)

            # Replace the properties value with just the field to validate against
            # This way, we are able to use one entire model schema and at runtime,
            # generate a new schema for just a field
            # ex. replace all properties of Track (blockhash, block, title, ...) with just 'title'
            field_to_validate_against = {
                field: cls._get_properties_field(schema_copy, model, field)
            }
            cls._set_property(schema_copy, model, field_to_validate_against)
            cls._set_required(schema_copy, model, field)

            # Add field schema to dict
            cls.models_to_schema_and_fields_dict[model]["field_schema"][
                field
            ] = schema_copy
        except BaseException as e:
            raise e

    @classmethod
    def get_properties_for_field(cls, model, field):
        try:
            field_schema = cls.models_to_schema_and_fields_dict[model]["field_schema"][
                field
            ]
            return field_schema["definitions"][model]["properties"][field]
        except KeyError:
            logger.warning(
                f"Could not find type for {field} for model {model}. Defaulting to 'None'"
            )
            return None

    @classmethod
    def _get_properties_field(cls, schema, model, field):
        try:
            return schema["definitions"][model]["properties"][field]
        except BaseException:
            logger.warning(
                f"Could not find field '{field}' for {model}. Schema will be empty for this field."
            )
            return {}  # empty schema

    @classmethod
    def _set_property(cls, schema, model, new_property):
        try:
            schema["definitions"][model]["properties"] = new_property
        except KeyError as ke:
            raise KeyError(f"Could not find keys for {model} schema: {ke}")

    @classmethod
    def _set_required(cls, schema, model, new_required):
        try:
            schema["definitions"][model]["required"] = [new_required]
        except KeyError as ke:
            raise KeyError(f"Could not find keys for {model} schema: {ke}")

    @classmethod
    def _get_required(cls, schema, model):
        try:
            return schema["definitions"][model]["required"]
        except KeyError as ke:
            raise KeyError(f"Could not find keys for {model} schema: {ke}")
