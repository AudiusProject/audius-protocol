from flask_restx import Model


class OneOfModel(Model):
    def __init__(self, name, model, *args, **kwargs):
        super(OneOfModel, self).__init__(name, model, *args, **kwargs)

    @property
    def _schema(self):
        return {"oneOf": [field.__schema__ for field in self.values()]}
