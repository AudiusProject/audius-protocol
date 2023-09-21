import ast
from typing import Dict, List, Tuple, Union

from flake8_plugins.flask_decorator_plugin.visitor_helpers import (
    ROUTE_HTTP_METHODS,
    RouteArgEntry,
    find_and_process_route_doc,
    find_item_to_move_above,
    is_api_expect_decorator,
    is_route_decorator,
    is_route_decorator_documented,
    parse_route_args,
)


class Visitor(ast.NodeVisitor):
    def __init__(self, decorator_order=[], api_doc_keyword_order=[]):
        self.problems: List[Tuple[int, int, str, Union[list, None]]] = []
        self.decorator_order_map: Dict[str, int] = {
            decorator: i for i, decorator in enumerate(decorator_order)
        }
        self.api_doc_keyword_order_map: Dict[str, int] = {
            keyword: i for i, keyword in enumerate(api_doc_keyword_order)
        }

    def visit_ClassDef(self, node: ast.ClassDef):
        route_args_dict: Dict[str, RouteArgEntry] = dict()
        can_check_route_args = False
        has_documented_route = False  # If there's at least one route that should be documented for this class
        has_class_level_expect = False
        methods_with_ids = []
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Call):
                # @api.route() decorators
                if is_route_decorator(decorator) and is_route_decorator_documented(
                    decorator
                ):
                    has_documented_route = True
                    if parse_route_args(decorator, route_args_dict):
                        can_check_route_args = True

                    methods_with_ids.extend(
                        find_and_process_route_doc(decorator, route_args_dict)
                    )
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
        item_to_move_above = find_item_to_move_above(
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
            item_to_move_above = find_item_to_move_above(
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
