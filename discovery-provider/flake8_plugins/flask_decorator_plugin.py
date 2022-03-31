import ast
import re
from typing import Any, Generator, List, Tuple, Type, Union

code_message_map = {
    "FDP001": 'Non-route parameter "{0}" specified in @api.doc(). Prefer using @api.expects() with a RequestParser instead for query parameters.',
    "FDP002": 'Decorator "{0}" out of order, should be higher in decorator list.',
    "FDP003": 'Keyword arg "{0}" out of order, should be higher in @api.doc() keyword arg list.',
}
DECORATOR_ORDER_MAP = {
    "record_metrics": 0,
    "doc": 1,
    "expects": 2,
    "marshal_with": 3,
    "cache": 4,
}

API_DOC_KEYWORD_ORDER_MAP = {"id": 0, "description": 1, "params": 2, "responses": 3}


class Visitor(ast.NodeVisitor):
    def __init__(self):
        self.problems: List[Tuple[int, int, str, Union[list, None]]] = []
        self._regex = re.compile(".*<.*:(.*)>.*")

    def visit_ClassDef(self, node: ast.ClassDef):
        route_args = []
        can_check_route_args = False
        for decorator in node.decorator_list:
            if (
                isinstance(decorator, ast.Call)
                and isinstance(decorator.func, ast.Attribute)
                and decorator.func.attr == "route"
            ):
                if len(decorator.args) > 0 and isinstance(
                    decorator.args[0], ast.Constant
                ):
                    value = decorator.args[0].value
                    route_args = self._regex.findall(value)
                    can_check_route_args = True

            for child in node.body:
                if isinstance(child, ast.FunctionDef):
                    decorators: List[str] = []
                    for decorator in child.decorator_list:
                        if isinstance(decorator, ast.Call):
                            if isinstance(decorator.func, ast.Attribute):
                                self._check_decorator_order(
                                    decorator.func.attr,
                                    decorators,
                                    (decorator.lineno, decorator.col_offset),
                                )
                                decorators.append(decorator.func.attr)
                                if decorator.func.attr == "doc":
                                    processed_keywords: List[str] = []
                                    for keyword in decorator.keywords:
                                        if can_check_route_args:
                                            self._check_route_params(
                                                keyword, route_args
                                            )
                                        if keyword.arg:
                                            self._check_doc_keyword_order(
                                                keyword, processed_keywords
                                            )
                                            processed_keywords.append(keyword.arg)
                            elif isinstance(decorator.func, ast.Name):
                                self._check_decorator_order(
                                    decorator.func.id,
                                    decorators,
                                    (decorator.lineno, decorator.col_offset),
                                )
                                decorators.append(decorator.func.id)
                        elif isinstance(decorator, ast.Name):
                            self._check_decorator_order(
                                decorator.id,
                                decorators,
                                (decorator.lineno, decorator.col_offset),
                            )
                            decorators.append(decorator.id)

        self.generic_visit(node)

    def _check_decorator_order(
        self,
        decorator_name: str,
        processed_decorators: List[str],
        line_and_col: Tuple[int, int],
    ):
        """Ensures the order of decorators is correct"""
        if decorator_name in DECORATOR_ORDER_MAP:
            processed_decorators = list(
                filter(lambda dec: dec in DECORATOR_ORDER_MAP, processed_decorators)
            )
            decorator_order_index = DECORATOR_ORDER_MAP[decorator_name]
            mapped = map(
                lambda dec: DECORATOR_ORDER_MAP[dec] <= decorator_order_index,
                processed_decorators,
            )
            if not all(mapped):
                self.problems.append(
                    (line_and_col[0], line_and_col[1], "FDP002", [decorator_name])
                )

    def _check_doc_keyword_order(
        self,
        keyword: ast.keyword,
        processed_keywords: List[str],
    ):
        """Checks that the @api.doc() keywords are in a defined order"""
        if keyword.arg in API_DOC_KEYWORD_ORDER_MAP:
            processed_keywords = list(
                filter(lambda kw: kw in API_DOC_KEYWORD_ORDER_MAP, processed_keywords)
            )
            keyword_order_index = API_DOC_KEYWORD_ORDER_MAP[keyword.arg]
            mapped = map(
                lambda kw: API_DOC_KEYWORD_ORDER_MAP[kw] <= keyword_order_index,
                processed_keywords,
            )
            if not all(mapped):
                self.problems.append(
                    (
                        keyword.value.lineno,
                        keyword.value.col_offset,
                        "FDP003",
                        [keyword.arg],
                    )
                )

    def _check_route_params(self, keyword: ast.keyword, route_args):
        """Checks that the @api.doc() decorator only includes params for the route."""
        if keyword.arg == "params" and isinstance(keyword.value, ast.Dict):
            for key in keyword.value.keys:
                if isinstance(key, ast.Constant) and key.value not in route_args:
                    self.problems.append(
                        (key.lineno, key.col_offset, "FDP001", [key.value])
                    )


class Plugin:
    name = __name__
    version = (1, 0, 0)

    def __init__(self, tree: ast.AST):
        self._tree = tree

    def run(self) -> Generator[Tuple[int, int, str, Type[Any]], None, None]:
        visitor = Visitor()
        visitor.visit(self._tree)
        for line, col, code, code_args in visitor.problems:
            message = code_message_map[code]
            if code_args is not None:
                message = message.format(*code_args)
            yield line, col, f"{code} {message}", type(self)
