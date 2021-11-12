import sys
import json
import time

for line in sys.stdin:
    message = line.strip()
    print(
        json.dumps(
            {
                "level": sys.argv[1],
                "type": "openresty",
                "log": json.dumps(
                    {"level": sys.argv[1], "type": "openresty", "message": message}
                ),
            }
        ),
        flush=True,
    )