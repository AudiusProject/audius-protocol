import sys
import json
import time

for line in sys.stdin:
    message = line.strip()
    print(
        json.dumps(
            {
                "level": sys.argv[1],
                "log": json.dumps({"level": sys.argv[1], "message": message}),
                "message": message,
            }
        ),
        flush=True,
    )
