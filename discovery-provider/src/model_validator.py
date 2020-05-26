import os
import json
# import logging  # pylint: disable=C0302
from jsonschema import validate, Draft7Validator, ValidationError, validators


# logger = logging.getLogger(__name__)

# https://app.quicktype.io/ -- JSON schema generator
class ModelValidator:
    @staticmethod
    def validate(instance, model):
        try:
            # get schema
            model_filename = './schema_' + model + "_simple.json"
            with open(model_filename) as f:
                schema = json.load(f)

            validator = Draft7Validator(schema)

            # validate each field & lazy print each error if error exists
            found_invalid_field = False
            for error in sorted(validator.iter_errors(instance), key=str):
                found_invalid_field = True
                print(error.message)

            # if any error occurs, raise exception
            if found_invalid_field:
                raise ValidationError('Instance {0} is not a proper {1}'.format(instance, model))
        except ValidationError as e:
            print(e)

track_with_all_fields = {
    "blockhash": "0xb4320405de01a4e02597bfb9980281c6b89db62be17f52e340ba519724b96316",
    "blocknumber": 30,
    "track_id": 20,
    "is_current": True,
    "is_delete": False,
    "owner_id": 2,
    "route_id": "some/routeid",
    "title": "fruit",
    "length": 0,
    "cover_art": "fish",
    "cover_art_sizes": "fish",
    "tags": "fish",
    "genre": "fish",
    "mood": "fish",
    "credits_splits": "fish",
    "remix_of": {
        "tracks": [
            {
                "parent_track_id": 67
            }
        ]
    },
    "create_date": "fish",
    "release_date": "fish",
    "file_type": "fish",
    "description": "fish",
    "license": "fish",
    "isrc": "fish",
    "iswc": "fish",
    "track_segments": [
        {
            "duration": 5,
            "multihash": "abcd"
        }
    ],
    "metadata_multihash": "fish",
    "download": {
        "cid": "QmfKLRvcq1hEXvX1vXKgPX9P58orVNg5YE9ioEhCPchwhp",
        "is_downloadable": True,
        "requires_follow": False
    },
    "updated_at": "2020-05-22T19:03:30.570035",
    "created_at": "2020-05-22T19:03:30.570061",
    "is_unlisted": False,
    "field_visibility": {
        "mood": True,
        "tags": True,
        "genre": True,
        "share": False,
        "play_count": False
    },
    "stem_of": {
        "category": "BASS",
        "parent_track_id": 292
    }
}

track_with_missing_fields = {
    "is_unlisted": True
}

# TODO: to be used for testing defaults
# track_with_minimum_fields = {
#     "blockhash": "0xb4320405de01a4e02597bfb9980281c6b89db62be17f52e340ba519724b96316",
#     "blocknumber": 30,
#     "track_id": 20,
#     "is_current": True,
#     "is_delete": False,
#     "owner_id": 2,
#     "route_id": "some/routeid",
#     "track_segments": [
#         {
#             "duration": 5,
#             "multihash": "abcd"
#         }
#     ],
#     "updated_at": "2020-05-22T19:03:30.570035",
#     "created_at": "2020-05-22T19:03:30.570061",
#     "is_unlisted": True
# }

# passes
print("Validating a track with all fields filled")
ModelValidator.validate(track_with_all_fields, 'track')

# fails
print("Validating a track not enough fields filled")
ModelValidator.validate(track_with_missing_fields, 'track')

# output:
'''
    u'blockhash' is a required property
    u'blocknumber' is a required property
    u'cover_art' is a required property
    u'cover_art_sizes' is a required property
    u'create_date' is a required property
    u'created_at' is a required property
    u'credits_splits' is a required property
    u'description' is a required property
    u'download' is a required property
    u'field_visibility' is a required property
    u'file_type' is a required property
    u'genre' is a required property
    u'is_current' is a required property
    u'is_delete' is a required property
    u'isrc' is a required property
    u'iswc' is a required property
    u'length' is a required property
    u'license' is a required property
    u'metadata_multihash' is a required property
    u'mood' is a required property
    u'owner_id' is a required property
    u'release_date' is a required property
    u'remix_of' is a required property
    u'route_id' is a required property
    u'stem_of' is a required property
    u'tags' is a required property
    u'title' is a required property
    u'track_id' is a required property
    u'track_segments' is a required property
    u'updated_at' is a required property
    Instance {'is_unlisted': True} is not a proper track
'''

# TODO: add defaults to schema
# print("Validating a track with all the minimally required fields filled")
# ModelValidator.validate(track_with_minimum_fields, 'track')