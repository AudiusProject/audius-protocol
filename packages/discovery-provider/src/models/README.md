# SQLAlchemy Models

Models are generated using the `sqlacodegen` tool (https://github.com/agronholm/sqlacodegen).

To generate new models, run

```
python3 -m pip install -r requirements.txt
sqlacodegen postgres://postgres:postgres@0.0.0.0:5432/discovery_provider_1 > out.py
```
