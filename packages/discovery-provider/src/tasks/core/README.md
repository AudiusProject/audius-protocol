# core

documentation for the python implementation of a core indexer

## generating the code
install a pyenv of your choice

```
pip install -r requirements.txt
make gen-py
```

After generation there may be some formatting things to change and sometimes imports need to be modified slightly.

These will need the # noqa after them so the timestamps import correctly. Otherwise the generated protobuf won't know what to do about timestamps.

```
_sym_db = _symbol_database.Default()  # noqa


from google.protobuf import (  # noqa
    timestamp_pb2 as google_dot_protobuf_dot_timestamp__pb2,
)
```

This also generates as
```
import protocol_pb2 as protocol__pb2
```

and needs to be modified to this since it's not at the project root.

```
from . import protocol_pb2 as protocol__pb2
```

Hopefully some future iteration of the python protoc generator can handle this.
