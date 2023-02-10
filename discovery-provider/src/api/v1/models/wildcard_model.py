from flask_restx import Model


class WildcardModel(Model):
    """Hack of the Model that allows the schema to be properly formatted for wildcard."""

    @property
    def _schema(self):
        # Skip the schema for this and surface the child schema if the wildcard is found
        if "*" in self:
            return self["*"].__schema__
        return super(WildcardModel, self)._schema()
