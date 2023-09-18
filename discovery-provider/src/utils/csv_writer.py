import csv
from io import StringIO
from typing import List


# Write CSV to string buffer before returning the contents of the string.
# This function takes a list of dictionaries, where each dictionary represents a row.
# Example:
#   rows = [{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]
#   write_csv(rows)
# Returns:
#    name,age
#    John,30
#    Jane,25
def write_csv(rows: List[dict]):
    if not rows:
        return ""

    fieldnames = list(rows[0].keys())
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

    return output.getvalue()
