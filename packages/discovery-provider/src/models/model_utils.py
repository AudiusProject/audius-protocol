from jsonschema import ValidationError
from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    Text,
    Unicode,
    UnicodeText,
    event,
    inspect,
)
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.sql import null

from src.model_validator import ModelValidator
from src.models.base import Base, logger


class RepresentableMixin:
    """Autogenerate __repr__ for SQLAlchemy models.

    Usage:

    ```
    class MyNewModel(Base, RepresentableMixin):
        ...
    ```
    """

    def __repr__(self):
        state = inspect(self)

        # Ensure that we do not print deferred/lazy-loaded
        # attributes. These could be relationships and printing them
        # will trigger them to be fetched.
        # https://stackoverflow.com/a/50330608
        def ga(attr):
            return (
                repr(getattr(self, attr))
                if attr not in state.unloaded
                else "<deferred>"
            )

        attrs = " ".join([f"{attr.key}={ga(attr.key)}" for attr in state.attrs])
        name = self.__class__.__name__
        return f"<{name}({attrs})>"


# Listen for instrumentation of attributes on the base class
# to add a listener on that attribute whenever it is set
@event.listens_for(Base, "attribute_instrument")
def configure_listener(class_, key_, inst):
    # Check that the attribute is a column (we only validate columns)
    if not hasattr(inst.property, "columns"):
        return

    # Listen for set events on the attribute to run our default validations
    @event.listens_for(inst, "set", retval=True)
    def set_(target, value, oldvalue, initiator):
        column_type = getattr(target.__class__, inst.key).type
        if (
            type(column_type) in (String, Text, Unicode, UnicodeText)
            and value
            and isinstance(value, str)
        ):
            value = value.encode("utf-8", "ignore").decode("utf-8", "ignore")
            value = value.replace("\x00", "")
        return value


# field_type is the sqlalchemy type from the model object
def validate_field_helper(field, value, model, field_type):
    # TODO: need to write custom validator for these datetime fields as jsonschema
    # validates datetime in format 2018-11-13T20:20:39+00:00, not a format we use
    # also not totally necessary as these fields are created server side
    if field in ("created_at", "updated_at", "release_date"):
        return value

    # remove null characters from varchar and text fields
    # Postgres does not support these well and it throws this error if you try to insert
    # `Fatal error in main loop A string literal cannot contain NUL (0x00) characters`
    # the fix is to replace those characters with empty with empty string
    # https://stackoverflow.com/questions/1347646/postgres-error-on-insert-error-invalid-byte-sequence-for-encoding-utf8-0x0
    if type(field_type) in (String, Text) and value:
        value = value.encode("utf-8", "ignore").decode("utf-8", "ignore")
        value = value.replace("\x00", "")

    to_validate = {field: value}
    try:
        ModelValidator.validate(to_validate=to_validate, model=model, field=field)
    except ValidationError as e:
        value = get_default_value(field, value, model, e)
    except BaseException as e:
        logger.error(f"Validation failed: {e}")

    return value


def get_default_value(field, value, model, e):
    field_props = ModelValidator.get_properties_for_field(model, field)

    # type field from the schema. this can either be a string or list
    # required by JSONSchema, cannot be None
    schema_type_field = field_props["type"]
    try:
        default_value = field_props["default"]
    except KeyError:
        default_value = None

    # If the schema indicates this field is equal to object(if string) or contains object(if list) and
    # the default value isn't set in the schema, set to SQL null, otherwise JSONB columns get
    # set to string 'null'.
    # Other fields can be set to their regular defaults or None.
    if not default_value:
        # if schema_type_field is defined as a list, need to check if 'object' is in list, else check string
        if isinstance(schema_type_field, list) and "object" in schema_type_field:
            default_value = null()  # sql null
        elif schema_type_field == "object":
            default_value = null()  # sql null

    logger.warning(
        f"Validation: Setting the default value {default_value} for field {field} "
        f"of type {schema_type_field} because of error: {e}"
    )

    return default_value


def get_fields_to_validate(model):
    try:
        fields = ModelValidator.models_to_schema_and_fields_dict[model]["fields"]
    except BaseException as e:
        logger.error(f"Validation failed: {e}. No validation will occur for {model}")
        fields = [""]

    return fields


class BlockMixin:
    # pylint: disable=property-with-parameters
    @declared_attr
    def __tablename__(self, cls):
        return cls.__name__.lower()

    blockhash = Column(String, primary_key=True)
    number = Column(Integer, nullable=True, unique=True)
    parenthash = Column(String)
    is_current = Column(Boolean)
