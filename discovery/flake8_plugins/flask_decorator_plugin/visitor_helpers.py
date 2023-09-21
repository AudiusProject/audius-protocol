import ast
import re
from typing import Dict, List, Tuple, TypedDict

ROUTE_HTTP_METHODS = ["get", "post", "put", "delete"]


class RouteArgEntry(TypedDict):
    locations: List[Tuple[int, int]]
    seen: bool


class UnknownParamKey(Exception):
    pass


def is_api_expect_decorator(decorator: ast.Call):
    return isinstance(decorator.func, ast.Attribute) and decorator.func.attr == "expect"


def is_route_decorator(decorator: ast.Call):
    """Returns true if the decorator is an @api.route() decorator"""
    return isinstance(decorator.func, ast.Attribute) and decorator.func.attr == "route"


route_parser_regex = re.compile("<[^:]*:?([^>]*)>")


def is_route_decorator_documented(route_decorator: ast.Call):
    """Checks if the given route decorator is marked doc=False"""
    for keyword in route_decorator.keywords:
        if keyword.arg == "doc":
            if isinstance(keyword.value, ast.Constant):
                if keyword.value.value == False:
                    return False
    return True


def parse_route_args(route_decorator: ast.Call, route_args_dict):
    """Parses an @api.route()'s first arg to get the route arguments"""
    can_check_route_args = False
    # First arg of the route decorator is the route
    if len(route_decorator.args) > 0 and isinstance(
        route_decorator.args[0], ast.Constant
    ):
        # Found a route that has a string constant, so we can parse it
        can_check_route_args = True
        route = route_decorator.args[0].value
        route_args_list = route_parser_regex.findall(route)
        for route_arg in route_args_list:
            if route_arg not in route_args_dict:
                route_args_dict[route_arg] = {
                    "locations": [],
                    "seen": False,
                }
            route_args_dict[route_arg]["locations"].append(
                (route_decorator.lineno, route_decorator.col_offset)
            )
    return can_check_route_args


def parse_ast_dict(ast_dict: ast.Dict):
    """Enumerates an AST dict by kvp"""
    for i, key in enumerate(ast_dict.keys):
        value = ast_dict.values[i]
        yield key, value


def find_and_process_route_doc(
    decorator: ast.Call, route_args_dict: Dict[str, RouteArgEntry]
):
    """Finds and processes the @api.route() doc argument"""
    methods_with_ids = []
    for keyword in decorator.keywords:
        if keyword.arg == "doc":
            if isinstance(keyword.value, ast.Constant) and keyword.value.value == False:
                return (False, [])
            # Check if doc has params documented for route_args
            elif isinstance(keyword.value, ast.Dict):
                try:
                    for param_name in find_param_descriptions_in_route_doc(
                        keyword.value
                    ):
                        if param_name in route_args_dict.keys():
                            route_args_dict[param_name]["seen"] = True
                except UnknownParamKey:
                    # If the key isn't a constant,
                    # then we don't know what param was described.
                    # Err on the side of caution and mark them all as seen
                    for key in route_args_dict:
                        route_args_dict[key]["seen"] = True
                methods_with_ids = [
                    method for method in get_method_ids_from_route_doc(keyword.value)
                ]
    return methods_with_ids


def find_param_descriptions_in_route_doc(doc: ast.Dict):
    """Marks route args as seen if they have a description in the @api.route()'s 'doc' arg"""
    for key, params in parse_ast_dict(doc):
        if isinstance(key, ast.Constant):
            # Route-level params documentation
            if key.value == "params" and isinstance(params, ast.Dict):
                for key, _ in parse_ast_dict(params):
                    if isinstance(key, ast.Constant):
                        yield key.value
            # The "doc" key can document individual methods, so check those too
            elif key.value in ROUTE_HTTP_METHODS:
                if isinstance(params, ast.Dict):
                    for key, nested_params in parse_ast_dict(params):
                        if isinstance(key, ast.Constant):
                            if key.value == "params" and isinstance(
                                nested_params, ast.Dict
                            ):
                                for key, _ in parse_ast_dict(nested_params):
                                    if isinstance(key, ast.Constant):
                                        yield key.value
                        else:
                            raise UnknownParamKey


def get_method_ids_from_route_doc(doc: ast.Dict):
    """Gets all the methods that have an operation id from a route doc"""
    for key, method_doc in parse_ast_dict(doc):
        if isinstance(key, ast.Constant):
            if key.value in ROUTE_HTTP_METHODS:
                method = key.value
                if isinstance(method_doc, ast.Dict):
                    for key, _ in parse_ast_dict(method_doc):
                        if isinstance(key, ast.Constant):
                            if key.value == "id":
                                yield method


def find_item_to_move_above(item: str, processed: List[str], order_map: Dict[str, int]):
    """Finds the first item in processed that should be below the given item, or None"""
    if item in order_map:
        order_index = order_map[item]
        processed.append(item)
        return next(
            (
                processed_item
                for processed_item in processed
                if order_map[processed_item] > order_index
            ),
            None,
        )
