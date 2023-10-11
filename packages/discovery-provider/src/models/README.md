# SQLAlchemy Models

Models are generated using the `sqlacodegen` tool (https://github.com/agronholm/sqlacodegen).

To generate new models, run

```
python3 -m pip install -r requirements.txt
sqlacodegen postgres://postgres:postgres@localhost:5432/audius_discovery > out.py
```
