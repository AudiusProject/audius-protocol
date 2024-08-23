from typing import Any, Dict, List, Union

from flask_restx import Model, SchemaModel, fields


class OneOfModel(SchemaModel):
    """
    This is a dirty, dirty hack.

    Swagger 2.0 doesn't support the oneOf composition provided in OAS 3.0.0+.
    This model does one possible representation of oneOf.

    This model makes the resulting swagger.json schema invalid.

    The Swagger UI seems to ignore the invalid schema. The OpenAPI generator
    can be configured to ignore it as well. In the Audiuis SDK Typescript
    generator, validation is skipped, and an OAS 3.0.0 spec is generated from
    the invalid swagger.json. In the conversion, OneOfModels become simple
    objects, so they are re-added from the swagger.json before generating
    the Typescript types.

    When marshalling, if not using a discriminator, the data must match
    **exactly** one of the formats. Unlike normal marshallers, this model is
    more of a validator. Without a discriminator, it doesn't know what to
    marshal to, so it just checks that the data matches one of the models.
    As implemented today, this check is not fatal - it only error logs and then
    return the original object.

    ** ONLY USE WITH `NestedOneOf`, it does NOT work with fields.Nested **

    example:

    .. code-block:: python
        ns.add_model(
            "my_one_of",
            OneOfModel(
                "my_one_of",
                [
                    model_a,
                    model_b
                ]
            )
        )
        my_model = ns.model(
            "my_model",
            {
                "my_field": NestedOneOf(my_one_of, allow_null=True)
            }
        )

    schema output:

    .. code-block:: json
        {
            // ...
            "definitions": {
                "my_one_of": {
                    "oneOf" [
                        { "ref": "#/definitions/model_a" },
                        { "ref": "#/definitinos/model_b" }
                    ]
                }
            }
        }

    discriminator example:

    .. code-block:: python
        ns.add_model(
            "my_one_of",
            OneOfModel(
                "my_one_of",
                {
                    "a": model_a,
                    "b": model_b
                },
                discriminator: "type"
            )
        )
        my_model = ns.model(
            "my_model",
            {
                "my_field": NestedOneOf(my_one_of)
            }
        )

    schema output:

    .. code-block:: json
        {
            // ...
            "definitions": {
                "my_one_of": {
                    "oneOf" [
                        { "ref": "#/definitions/model_a" },
                        { "ref": "#/definitinos/model_b" }
                    ]
                }
            }
        }

    See also: access_gate usage in tracks.py
    """

    def __init__(
        self,
        name,
        models_or_mapping: Union[List[Model], Dict[str, Model]],
        discriminator: Union[str, None] = None,
        *args,
        **kwargs
    ):
        if isinstance(models_or_mapping, dict):
            if discriminator is None:
                raise RuntimeError("Discriminator cannot be None if using mapping")
            mapping = models_or_mapping
            models = [model for model in models_or_mapping.values()]
        else:
            if discriminator is not None:
                raise RuntimeError("Discriminator cannot be used without mapping")
            models = models_or_mapping
            mapping = None

        nested_fields = [fields.Nested(model) for model in models]

        schema: Dict[str, Any] = {
            "oneOf": [field.__schema__ for field in nested_fields],
        }
        if discriminator is not None and mapping is not None:
            schema["discriminator"] = {
                "propertyName": discriminator,
                "mapping": {
                    key: fields.Nested(model).__schema__["$ref"]
                    for key, model in mapping.items()
                },
            }

        super(OneOfModel, self).__init__(
            name,
            schema,
        )
        self.discriminator = discriminator
        self.mapping = mapping
        self.models = models

        # hack to register related models - hijacks Polymorphism pattern
        self.__parents__ = models

    @property
    def __schema__(self):
        # override the base model to prevent the polymorph allOf from happening
        return self._schema


class WildcardModel(Model):
    """Hack of the Model that allows the schema to be properly formatted for a wildcard field."""

    @property
    def _schema(self):
        # Skip the schema for this and surface the child schema if the wildcard is found
        if "*" in self:
            return self["*"].__schema__
        return super(WildcardModel, self)._schema()
