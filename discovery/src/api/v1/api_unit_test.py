import operator

from flask import Flask

from src.api.v1 import api as api_v1

method_order = {
    "parameters": 0,
    "head": 1,
    "get": 2,
    "post": 3,
    "put": 4,
    "delete": 5,
    "options": 6,
}

MAX_DESCRIPTION_CHARS = 120


def make_error(msg="", method=None, path=None):
    return {
        "msg": msg,
        "method": method,
        "path": path,
        "method_index": method_order[method],
    }


def validate_schema(schema):
    errors = []
    operationIdMap = {}
    for path, resource in schema["paths"].items():
        for method, request in resource.items():
            if method != "parameters":
                # Check request endpoints have descriptions
                if "description" not in request or request["description"] is None:
                    errors.append(
                        make_error(
                            "Missing endpoint description annotation", method, path
                        )
                    )
                # Check long descriptions have a summary
                elif (
                    MAX_DESCRIPTION_CHARS >= 0
                    and len(request["description"]) > MAX_DESCRIPTION_CHARS
                    and ("summary" not in request or request["summary"] is None)
                ):
                    errors.append(
                        make_error(
                            f'Description too long ({len(request["description"])}) and no summary provided',
                            method,
                            path,
                        )
                    )

                # Check for duplicate Operation IDs
                operationId = request["operationId"]
                if operationId not in operationIdMap:
                    operationIdMap[operationId] = []
                operationIdMap[operationId].append({"path": path, "method": method})

                # Check method level request parameters have descriptions
                if "parameters" in request:
                    for parameter in request["parameters"]:
                        if (
                            "description" not in parameter
                            or parameter["description"] is None
                        ):
                            errors.append(
                                make_error(
                                    f'Missing parameter description annotation for "{parameter["name"]}"',
                                    method,
                                    path,
                                )
                            )
            else:
                # Check route level request parameters have descriptions
                for parameter in request:
                    if (
                        "description" not in parameter
                        or parameter["description"] is None
                    ):
                        errors.append(
                            make_error(
                                f'Missing parameter description annotation for "{parameter["name"]}"',
                                method,
                                path,
                            )
                        )

    for operationId, duplicates in operationIdMap.items():
        if len(duplicates) > 1:
            for duplicate in duplicates:
                errors.append(
                    make_error(f'Duplicate operation ID "{operationId}"', **duplicate)
                )
    return errors


def print_errors(errors):
    paths = sorted(set(map(lambda x: x["path"], errors)))
    print(f"\n\nFound {len(errors)} errors in Swagger schema")
    if errors:
        for path in paths:
            print(f"\n{path}:")
            print("----------------------------------------------")
            path_errors = [error for error in errors if error["path"] == path]
            for error in sorted(
                path_errors, key=operator.itemgetter("method_index", "msg")
            ):
                print(f'{error["method"].upper()} {error["msg"]}')
        print("")


def test_validate_v1_swagger():
    """Validate API V1 schema output"""
    app = Flask(__name__)
    app.register_blueprint(api_v1.bp)
    with app.app_context(), app.test_request_context():
        schema = api_v1.api_v1.__schema__
        errors = validate_schema(schema)
        if errors:
            print_errors(errors)
        assert len(errors) == 0, "Generated Swagger API documentation has no errors"


def test_validate_v1_full_swagger():
    """Validate API V1 Full schema output"""
    app = Flask(__name__)
    app.register_blueprint(api_v1.bp_full)
    with app.app_context(), app.test_request_context():
        schema = api_v1.api_v1_full.__schema__
        errors = validate_schema(schema)
        if errors:
            print_errors(errors)
        assert len(errors) == 0, "Generated Swagger API documentation has no errors"
