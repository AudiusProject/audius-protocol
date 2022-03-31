import ast

from flask_decorator_plugin import Plugin, Visitor

non_route_param_example = """
@full_ns.route("/<string:track_id>/remixes")
class FullRemixesRoute(Resource):
    @record_metrics
    @full_ns.doc(
        id="Get Track Remixes",
        description="Get all tracks that remix the given track",
        params={"track_id": "A Track ID", "some_param": "Not in the route"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(remixes_response)
    @cache(ttl_sec=10)
    def get(self, track_id):
        pass
"""

variable_route_param_example = """
@ns.route(TRACK_ROUTE)
class Track(Resource):
    @record_metrics
    @ns.doc(
        id=\"Get Track\",
        description=\"Gets a track by ID\",
        params={\"track_id\": \"A Track ID\"},
        responses={200: \"Success\", 400: \"Bad request\", 500: \"Server error\"},
    )
    @ns.marshal_with(track_response)
    @cache(ttl_sec=5)
    def get(self, track_id):
        decoded_id = decode_with_abort(track_id, ns)
        return get_single_track(decoded_id, None, ns)
"""

attribute_order_example = """
@full_ns.route(\"/<string:track_id>/remixes\")
class FullRemixesRoute(Resource):
    @full_ns.doc(
        id=\"Get Track Remixes\",
        description=\"Get all tracks that remix the given track\",
        params={\"track_id\": \"A Track ID\"},
    )
    @record_metrics
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(remixes_response)
    @cache(ttl_sec=10)
    def get(self, track_id):
        pass
"""

keyword_order_example = """
@ns.route("/<string:track_id>")
class Track(Resource):
    @record_metrics
    @ns.doc(
        id=\"Get Track\",
        description=\"Gets a track by ID\",
        responses={200: \"Success\", 400: \"Bad request\", 500: \"Server error\"},
        params={\"track_id\": \"A Track ID\"},
    )
    @ns.marshal_with(track_response)
    @cache(ttl_sec=5)
    def get(self, track_id):
        decoded_id = decode_with_abort(track_id, ns)
        return get_single_track(decoded_id, None, ns)
"""


def _results(s: str):
    tree = ast.parse(s)
    visitor = Visitor()
    visitor.visit(tree)
    return list(
        map(
            lambda problem: {
                "line": problem[0],
                "col": problem[1],
                "code": problem[2],
                "code_args": problem[3],
            },
            visitor.problems,
        )
    )


def test_non_route_param():
    first_result = _results(non_route_param_example)[0]
    assert first_result["line"] == 8
    assert first_result["col"] == 42
    assert first_result["code"] == "FDP001"
    assert first_result["code_args"] == ["some_param"]


def test_variable_route_param():
    assert not _results(variable_route_param_example)


def test_attribute_order():
    first_result = _results(attribute_order_example)[0]
    assert first_result["line"] == 9
    assert first_result["col"] == 5
    assert first_result["code"] == "FDP002"
    assert first_result["code_args"] == ["record_metrics"]


def test_keyword_order():
    first_result = _results(keyword_order_example)[0]
    assert first_result["line"] == 9
    assert first_result["col"] == 15
    assert first_result["code"] == "FDP003"
    assert first_result["code_args"] == ["params"]


def test_plugin_format():
    tree = ast.parse(non_route_param_example)
    plugin = Plugin(tree)
    results = {f"{line}:{col} {msg}" for line, col, msg, _ in plugin.run()}
    assert results == {
        '8:42 FDP001 Non-route parameter "some_param" specified in @api.doc(). Prefer using @api.expects() with a RequestParser instead for query parameters.'
    }
