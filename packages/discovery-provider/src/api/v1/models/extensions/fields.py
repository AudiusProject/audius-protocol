from flask_restx import fields, marshal

from .models import OneOfModel


# region: Copied from flask_restx
def is_indexable_but_not_string(obj):
    return not hasattr(obj, "strip") and hasattr(obj, "__iter__")


def is_integer_indexable(obj):
    return isinstance(obj, list) or isinstance(obj, tuple)


def get_value(key, obj, default=None):
    """Helper for pulling a keyed value off various types of objects"""
    if isinstance(key, int):
        return _get_value_for_key(key, obj, default)
    elif callable(key):
        return key(obj)
    else:
        return _get_value_for_keys(key.split("."), obj, default)


def _get_value_for_keys(keys, obj, default):
    if len(keys) == 1:
        return _get_value_for_key(keys[0], obj, default)
    else:
        return _get_value_for_keys(
            keys[1:], _get_value_for_key(keys[0], obj, default), default
        )


def _get_value_for_key(key, obj, default):
    if is_indexable_but_not_string(obj):
        try:
            return obj[key]
        except (IndexError, TypeError, KeyError):
            pass
    if is_integer_indexable(obj):
        try:
            return obj[int(key)]
        except (IndexError, TypeError, ValueError):
            pass
    return getattr(obj, key, default)


# endregion Copied from flask_restx


class NestedOneOf(fields.Nested):
    """
    Unlike other models, the OneOfModel doesn't inherit dict. fields.Nested
    doesn't know how to process the output - it tries to marshal the model
    as a dict.

    This NestedOneOf is used the same as fields.Nested but only for OneOfModels.
    It attempts to marshal to each of the fields specified in OneOfModel and
    returns whichever one matches the original object, throwing if none do.

    The throwing behavior is different from other fields, and the "marshalling"
    behaves more like "validating". Care should be taken to ensure only the
    exact matching data is represented in this field.
    """

    def __init__(self, model: OneOfModel, **kwargs):
        super(NestedOneOf, self).__init__(model, **kwargs)

    def output(self, key, data, **kwargs):
        value = get_value(key, data)
        if value is None:
            if self.allow_null:
                return None
            elif self.default is not None:
                return self.default
        for field in self.model.fields:
            try:
                marshalled = marshal(value, field.nested)
                print(f"MARCUS | value={value} marshalled={marshalled}")
                if value == marshalled:
                    return value
            except fields.MarshallingError as e:
                raise e
        raise fields.MarshallingError("No matching oneOf models")
