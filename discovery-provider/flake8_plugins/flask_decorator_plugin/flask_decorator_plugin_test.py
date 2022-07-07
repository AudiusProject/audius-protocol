import ast

from flake8_plugins.flask_decorator_plugin.flask_decorator_plugin import Plugin
from flake8_plugins.flask_decorator_plugin.visitor import Visitor

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


decorator_order_example = """
@full_ns.route(
    \"/trending\",
    defaults={\"version\": DEFAULT_TRENDING_VERSIONS[TrendingType.PLAYLISTS].name},
    strict_slashes=False,
)
@full_ns.route(\"/trending/<string:version>\")
class FullTrendingPlaylists(Resource):
    @full_ns.expect(full_trending_playlist_parser)
    @record_metrics
    @full_ns.doc(
        id=\"Get Trending Playlists With Version\",
        description=\"Returns trending playlists for a time period based on the given trending version\",
        responses={200: \"Success\", 400: \"Bad request\", 500: \"Server error\"},
    )
    @full_ns.marshal_with(full_trending_playlists_response)
    def get(self, version):
        \"Get trending playlists\"
        pass
"""

doc_false_example = """
@ns.route(\"/aggregates/routes/trailing/month\", doc=False)
class AggregateRouteMetricsTrailingMonth(Resource):
    @cache(ttl_sec=30 * 60)
    @record_metrics
    @ns.doc({\"params\": {\"foo\": \"bar\"}})
    def get(self):
        \"Gets aggregated route metrics for the last trailing 30 days\"
        metrics = get_aggregate_route_metrics_trailing_month()
        response = success_response(metrics)
        return response
"""

top_level_expect_example = """
@ns.route(\"/app_name/trailing/<string:time_range>\")
@ns.expect(trailing_app_name_parser)
class TrailingAppNameMetric(Resource):
    @ns.doc(
        id=\"Get Trailing App Name Metrics\",
        description=\"Gets the trailing app name metrics\",
    )
    @ns.marshal_with(app_name_trailing_response)
    @cache(ttl_sec=3 * 60 * 60)
    def get(self, time_range):
        pass
"""


route_doc_example = """
@ns.route(\"/app_name/trailing/<string:time_range>\", doc={\"params\":{\"time_range\": \"A time range\"}})
class TrailingAppNameMetric(Resource):
    @ns.doc(
        id=\"Get Trailing App Name Metrics\",
        description=\"Gets the trailing app name metrics\",
    )
    @ns.marshal_with(app_name_trailing_response)
    @cache(ttl_sec=3 * 60 * 60)
    def get(self, time_range):
        pass
"""

route_doc_get_params_example = """
@ns.route(
    \"/trending\",
    doc={
        \"get\": {
            "id": \"Get Trending Tracks\",
            "description": \"Gets the top 100 trending (most popular) tracks on Audius\",
        }
    },
)
@ns.route(
    \"/trending/<string:version>\",
    doc={
        \"get\": {
            \"id\": \"Get Trending Tracks With Version\",
            \"description\": \"Gets the top 100 trending (most popular) tracks on Audius using a given trending strategy version\",
            \"params\": {\"version\": \"The strategy version of trending to use\"},
        }
    },
)
class Trending(Resource):
    @record_metrics
    @ns.expect(trending_parser)
    @ns.marshal_with(tracks_response)
    @cache(ttl_sec=TRENDING_TTL_SEC)
    def get(self, version):
        pass
"""

doc_id_missing_example = """
@full_ns.route(\"/genre/top\")
class FullTopGenreUsers(Resource):
    @full_ns.doc(
        description=\"Get the Top Users for a Given Genre\",
    )
    def get(self):
        pass
"""

doc_missing_example = """
@full_ns.route(\"/genre/top\")
class FullTopGenreUsers(Resource):
    def get(self):
        pass
"""

method_id_in_route_doc_example = """
@full_ns.route(\"/genre/top\", doc={\"get\": {\"id\": \"foo\"}})
class FullTopGenreUsers(Resource):
    @full_ns.doc(
        description=\"Get the Top Users for a Given Genre\",
    )
    def get(self):
        pass
"""

doc_false_with_route_param_example = """
@ns.route(
    \"/trending\",
    defaults={\"version\": DEFAULT_TRENDING_VERSIONS[TrendingType.TRACKS].name},
    strict_slashes=False,
    doc={
        "get": {
            "id": \"Get Trending Tracks\",
            "description": \"Gets the top 100 trending (most popular) tracks on Audius\",
        }
    },
)
@ns.route(\"/trending/<string:version>\", doc=False)
class Trending(Resource):
    def get(self, version):
        pass
"""


def _results(s: str):
    tree = ast.parse(s)
    visitor = Visitor(
        decorator_order=["record_metrics", "doc", "expect", "marshal_with", "cache"],
        api_doc_keyword_order=["id", "description", "params", "responses"],
    )
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
    assert first_result["code_args"] == ["record_metrics", "doc"]


def test_keyword_order():
    first_result = _results(keyword_order_example)[0]
    assert first_result["line"] == 9
    assert first_result["col"] == 15
    assert first_result["code"] == "FDP003"
    assert first_result["code_args"] == ["params", "responses"]


def test_decorator_order():
    results = _results(decorator_order_example)
    assert results[0]["code"] == "FDP002"
    assert results[0]["code_args"] == ["record_metrics", "expect"]
    assert results[1]["code"] == "FDP002"
    assert results[1]["code_args"] == ["doc", "expect"]
    assert results[2]["code"] == "FDP004"
    assert results[2]["code_args"] == ["version"]


def test_doc_false():
    assert not _results(doc_false_example)


def test_top_level_expect():
    assert not _results(top_level_expect_example)


def test_route_doc():
    assert not _results(route_doc_example)


def test_route_level_param():
    assert not _results(route_doc_get_params_example)


def test_doc_id_missing():
    assert _results(doc_id_missing_example)[0]["code"] == "FDP005"


def test_doc_missing():
    assert _results(doc_missing_example)[0]["code"] == "FDP005"


def test_method_id_in_route():
    assert not _results(method_id_in_route_doc_example)


def test_doc_false_with_route_param():
    assert not _results(doc_false_with_route_param_example)


def test_plugin_format():
    tree = ast.parse(non_route_param_example)
    plugin = Plugin(tree)
    results = {f"{line}:{col} {msg}" for line, col, msg, _ in plugin.run()}
    assert results == {
        '8:42 FDP001 Non-route parameter "some_param" specified in @api.doc(). Use @api.expects() with a RequestParser instead for query parameters.'
    }
