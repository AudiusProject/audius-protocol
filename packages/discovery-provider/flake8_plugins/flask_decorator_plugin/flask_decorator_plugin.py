import ast
from typing import Any, Generator, List, Tuple, Type

from flake8.options.manager import OptionManager

from flake8_plugins.flask_decorator_plugin.visitor import Visitor

code_message_map = {
    "FDP001": 'Non-route parameter "{0}" specified in @api.doc(). Use @api.expects() with a RequestParser instead for query parameters.',
    "FDP002": 'Decorators out of order. Decorator "{0}" should be above "{1}" in function decorator list.',
    "FDP003": 'Keyword args out of order. Arg "{0}" should be above "{1}" in @api.doc() keyword arg list.',
    "FDP004": 'Route parameter "{0}" missing from @api.doc() params. Are you missing an @api.expect()?',
    "FDP005": 'Missing ID for resource method "{0}". Define an ID using @api.doc(id="<some pretty id>").',
}


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
