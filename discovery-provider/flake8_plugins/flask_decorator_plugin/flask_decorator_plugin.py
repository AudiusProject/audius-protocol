import ast
import re
from typing import Any, Dict, Generator, List, Tuple, Type, TypedDict, Union

from flake8.options.manager import OptionManager

code_message_map = {
    "FDP001": 'Non-route parameter "{0}" specified in @api.doc(). Use @api.expects() with a RequestParser instead for query parameters.',
    "FDP002": 'Decorators out of order. Decorator "{0}" should be above "{1}" in function decorator list.',
    "FDP003": 'Keyword args out of order. Arg "{0}" should be above "{1}" in @api.doc() keyword arg list.',
    "FDP004": 'Route parameter "{0}" missing from @api.doc() params. Are you missing an @api.expect()?',
    "FDP005": 'Missing ID for resource method "{0}". Define an ID using @api.doc(id="<some pretty id>").',
}

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


route_parser_regex = re.compile(".*<[^:]*:?(.*)>.*")


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
    """Assuming all keys and values are constants, parses an AST dict"""
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
    return (True, methods_with_ids)


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


def check_order(item: str, processed: List[str], order_map: Dict[str, int]):
    """Ensures the order of items is correct"""
    if item in order_map:
        decorator_order_index = order_map[item]
        mapped = map(
            lambda dec: order_map[dec] <= decorator_order_index,
            processed,
        )
        processed.append(item)
        move_above_index = next(
            (i for i, is_smaller in enumerate(mapped) if not is_smaller), None
        )
        if move_above_index is None:
            return None
        return processed[move_above_index]


class Visitor(ast.NodeVisitor):
    def __init__(self, decorator_order=[], api_doc_keyword_order=[]):
        self.problems: List[Tuple[int, int, str, Union[list, None]]] = []
        self.decorator_order_map = {
            decorator: i for i, decorator in enumerate(decorator_order)
        }
        self.api_doc_keyword_order_map = {
            keyword: i for i, keyword in enumerate(api_doc_keyword_order)
        }

    def visit_ClassDef(self, node: ast.ClassDef):
        route_args_dict: Dict[str, RouteArgEntry] = dict()
        can_check_route_args = False
        has_documented_route = False
        has_class_level_expect = False
        methods_with_ids = []
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Call):
                if is_route_decorator(decorator):
                    if parse_route_args(decorator, route_args_dict):
                        can_check_route_args = True

                    (
                        is_route_documented,
                        methods_with_ids,
                    ) = find_and_process_route_doc(decorator, route_args_dict)
                    if is_route_documented:
                        has_documented_route = True
                elif is_api_expect_decorator(decorator):
                    has_class_level_expect = True

        # Skip undocumented routes or non-resource classes
        if not has_documented_route:
            self.generic_visit(node)
            return

        for child in node.body:
            if isinstance(child, ast.FunctionDef) and child.name in ROUTE_HTTP_METHODS:
                processed_decorators: List[str] = []
                for decorator in child.decorator_list:
                    # Callable decorators
                    if isinstance(decorator, ast.Call):
                        # Namespaced decorators (eg. @api.doc() or @api.expect() or @api.marshal_with())
                        if isinstance(decorator.func, ast.Attribute):
                            self._check_decorator_order(
                                decorator.func.attr,
                                processed_decorators,
                                (decorator.lineno, decorator.col_offset),
                            )
                            if decorator.func.attr == "doc":
                                processed_keywords: List[str] = []
                                for keyword in decorator.keywords:
                                    if can_check_route_args:
                                        self._check_doc_params_only_routes(
                                            keyword, route_args_dict
                                        )
                                    if keyword.arg:
                                        self._check_doc_keyword_order(
                                            keyword, processed_keywords
                                        )
                                    if keyword.arg == "id":
                                        methods_with_ids.append(child.name)
                        # Function decorators (eg. @cache())
                        elif isinstance(decorator.func, ast.Name):
                            self._check_decorator_order(
                                decorator.func.id,
                                processed_decorators,
                                (decorator.lineno, decorator.col_offset),
                            )
                    # Name-only decorators (eg. @record_metrics)
                    elif isinstance(decorator, ast.Name):
                        self._check_decorator_order(
                            decorator.id,
                            processed_decorators,
                            (decorator.lineno, decorator.col_offset),
                        )
                # Check that method has a custom id
                if child.name not in methods_with_ids:
                    self.problems.append(
                        (
                            child.lineno,
                            child.col_offset,
                            "FDP005",
                            [child.name],
                        )
                    )

        # Skip check if there's a toplevel @api.expect() as that could document them.
        if not has_class_level_expect:
            self._check_route_args_have_descriptions(route_args_dict)
        self.generic_visit(node)

    def _check_doc_params_only_routes(
        self, keyword: ast.keyword, route_args: Dict[str, RouteArgEntry]
    ):
        """Checks that the @api.doc() decorator only includes params for the route."""
        if keyword.arg == "params" and isinstance(keyword.value, ast.Dict):
            for key in keyword.value.keys:
                if isinstance(key, ast.Constant):
                    if key.value not in route_args:
                        self.problems.append(
                            (key.lineno, key.col_offset, "FDP001", [key.value])
                        )
                    else:
                        route_args[key.value]["seen"] = True

    def _check_decorator_order(
        self,
        decorator_name: str,
        processed_decorators: List[str],
        line_and_col: Tuple[int, int],
    ):
        """Ensures the order of decorators is correct"""
        item_to_move_above = check_order(
            decorator_name, processed_decorators, self.decorator_order_map
        )
        if item_to_move_above is not None:
            self.problems.append(
                (
                    line_and_col[0],
                    line_and_col[1],
                    "FDP002",
                    [decorator_name, item_to_move_above],
                )
            )

    def _check_doc_keyword_order(
        self,
        keyword: ast.keyword,
        processed_keywords: List[str],
    ):
        """Checks that the @api.doc() keywords are in a defined order"""
        if isinstance(keyword.arg, str):
            item_to_move_above = check_order(
                keyword.arg, processed_keywords, self.api_doc_keyword_order_map
            )
            if item_to_move_above is not None:
                self.problems.append(
                    (
                        keyword.value.lineno,
                        keyword.value.col_offset,
                        "FDP003",
                        [keyword.arg, item_to_move_above],
                    )
                )

    def _check_route_args_have_descriptions(
        self, route_args_dict: Dict[str, RouteArgEntry]
    ):
        """Checks that all the route args have been seen with a description"""
        for route_arg, route_entry in route_args_dict.items():
            if not route_entry["seen"]:
                for location in route_entry["locations"]:
                    self.problems.append(
                        (location[0], location[1], "FDP004", [route_arg])
                    )


class Plugin:
    name = __name__
    version = (1, 0, 0)

    decorator_order: List[str] = []
    api_doc_keyword_order: List[str] = []

    def __init__(self, tree: ast.AST):
        self._tree = tree

    def run(self) -> Generator[Tuple[int, int, str, Type[Any]], None, None]:
        visitor = Visitor(self.decorator_order, self.api_doc_keyword_order)
        visitor.visit(self._tree)
        for line, col, code, code_args in visitor.problems:
            message = code_message_map[code]
            if code_args is not None:
                message = message.format(*code_args)
            yield line, col, f"{code} {message}", type(self)

    @classmethod
    def add_options(cls, option_manager: OptionManager):
        option_manager.add_option(
            "--fdp-decorator-order",
            parse_from_config=True,
            comma_separated_list=True,
            default="",
            help="The order that decorators should be in for each resource function. Omitted names will be ignored.",
        )
        option_manager.add_option(
            "--fdp-api-doc-keyword-order",
            parse_from_config=True,
            comma_separated_list=True,
            default="",
            help="The order that keywords should be in for each @api.doc(). Omitted names will be ignored.",
        )

    @classmethod
    def parse_options(cls, options):
        cls.decorator_order = options.fdp_decorator_order
        cls.api_doc_keyword_order = options.fdp_api_doc_keyword_order
