from flask import Flask, Blueprint
from flask_restx import Resource, Namespace, fields

ns = Namespace('tracks', description='Track related operations')

track_segment = {
  "duration": fields.Float(required=True),
  "multihash": fields.String(required=True)
}

track_segment_model = ns.model('Track Segment', track_segment)

track_repost = ns.model('Track Repost', {
  "blockhash":	fields.String(required=True),
  "blocknumber": fields.Integer(required=True),
  "created_at": fields.String(required=True),
  "is_current":	fields.Boolean(required=True),
  "is_delete":	fields.Boolean(required=True),
  "repost_item_id":	fields.Integer(required=True),
  "repost_type":	fields.String(required=True),
  "user_id":	fields.Integer(required=True)
})

track_favorite = ns.model('Track Favorite', {
  "blockhash":	fields.String(required=True),
  "blocknumber": fields.Integer(required=True),
  "created_at": fields.String(required=True),
  "is_current":	fields.Boolean(required=True),
  "is_delete":	fields.Boolean(required=True),
  "save_item_id":	fields.Integer(required=True),
  "save_type":	fields.String(required=True),
  "user_id":	fields.Integer(required=True)
})

track_element = ns.model('Track Element', {
  "parent_track_id": fields.Integer(required=True)
})

remix_parent = ns.model('Remix Parent', {
  "tracks": fields.List(fields.Nested(track_element))
})

stem_parent = ns.model('Stem Parent', {
  "category": fields.String(required=True),
  "parent_track_id": fields.Integer(required=True)
})

download = ns.model('Download Metadata', {
  "cid": fields.String,
  "is_downloadable": fields.Boolean(required=True),
  "required_follow": fields.Boolean(required=True),
})

field_visibility = ns.model('Field Visibility', {
  "mood": fields.Boolean,
  "tags": fields.Boolean,
  "genre": fields.Boolean,
  "share": fields.Boolean,
  "play_count": fields.Boolean,
  "remixes": fields.Boolean
})

track = {
      "blockhash": fields.String(required=True),
      "blocknumber": fields.Integer(required=True),
      "cover_art": fields.String,
      "cover_art_sizes": fields.String,
      "create_date": fields.String,

      # TODO: this should be a date. What format is this? "2019-11-17T07:51:15 Z",
      "created_at": fields.String,
      "credits_splits": fields.String,
      "description": fields.String,
      "download": fields.Nested(download),
      "field_visibility": fields.Nested(field_visibility),
      "file_type": fields.String,
      "followee_reposts": fields.List(fields.Nested(track_repost), required=True),
      "followee_saves": fields.List(fields.Nested(track_favorite), required=True),
      "genre": fields.String,
      "has_current_user_reposted": fields.Boolean(required=True),
      "has_current_user_saved": fields.Boolean(required=True),
      "is_current": fields.Boolean(required=True),
      "is_delete": fields.Boolean(required=True),
      "is_unlisted": fields.Boolean(required=True),
      "isrc": fields.String,
      "iswc": fields.String,
      "length": fields.Integer,
      "license": fields.String,
      "metadata_multihash": fields.String(required=True),
      "mood": fields.String,
      "owner_id": fields.Integer(required=True),
      "release_date": fields.String,
      "remix_of": fields.Nested(remix_parent),
      "repost_count": fields.Integer(required=True),
      "route_id": fields.String(required=True),
      "save_count": fields.Integer(required=True),
      "stem_of": fields.Nested(stem_parent),
      "tags": fields.String,
      "title": fields.String(required=True),
      "track_id": fields.Integer(required=True),
      "track_segments": fields.List(fields.Nested(track_segment_model)),
      "updated_at": fields.String,
      # TODO: Add User when we've created the User models
}

version_metadata = ns.model("Version Metadata", {
  "service": fields.String(required=True),
  "version": fields.String(required=True)
})

track_response = ns.model("Tracks Response", {
  "data": fields.List(fields.Nested(track), required=True),
  "latest_chain_block":	fields.Integer(required=True),
  "latest_indexed_block":	fields.Integer(required=True),
  "owner_wallet":	fields.Integer(required=True),
  "signature": fields.Integer(required=True),
  "success": fields.Boolean(required=True),
  "timestamp": fields.String(required=True)	,
  "version": fields.Nested(version_metadata, required=True),
})

track_model = ns.model("Track", track)
@ns.route('/')
@ns.doc(params={
    "id": "The Track ID.",
    "user_id": "The User ID.",
    "filter_deleted": "Whether to filter out deleted tracks.",
    "min_block_number": "Only show tracks with block_number > than min_block_number.",
    "with_users": "Whether to return users embedded in tracks."
})
class TrackList(Resource):
  @ns.response(200, 'Success', track_model)
  def get(self):
    """Fetch a list of tracks"""
    return {"somedata": "hello world!"}



