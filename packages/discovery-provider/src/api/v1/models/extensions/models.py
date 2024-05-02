from typing import List

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

    When marshalling, the dat must match **exactly** one of the formats.
    Unlike normal marshallers, this model is more of a validator. Without
    a discriminator, it doesn't know what to marshal to, so it just checks
    that the data matches one of the models.

    ** ONLY USE WITH `NestedOneOf`, it does NOT work with fields.Nested **

    example:
    ```
    ns.add_model("my_one_of", OneOfModel("my_one_of", [fields.Nested(model_a), fields.Nested(model_b)]))
    my_model = ns.model("my_model", { "my_field": NestedOneOf(my_one_of, allow_null=True) })
    ```

    schema output:
    ```
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
    ```

    See also: access_gate usage in tracks.py
    """

    def __init__(self, name, fields: List[fields.Nested], *args, **kwargs):
        super(OneOfModel, self).__init__(
            name, {"oneOf": [field.__schema__ for field in fields]}
        )
        self.fields = fields

        # hack to register related models - hijacks Polymorphism pattern
        self.__parents__ = [field.nested for field in self.fields]

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
