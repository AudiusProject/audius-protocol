import logging

from jsonschema import ValidationError
from src.model_validator import ModelValidator

logger = logging.getLogger("model_validator")

###### Testing field validation with variation of instances ######
def test_one_field_schema_pass():
    track = {"title": "ok"}
    try:
        ModelValidator.validate(to_validate=track, field="title", model="Track")
    except ValidationError as e:
        assert False, f"test_model_validator [test_one_field_schema_pass] failed: {e}"


def test_one_field_schema_bad_value():
    track = {"title": 1}
    try:
        ModelValidator.validate(to_validate=track, field="title", model="Track")
        assert False, "test_model_validator [test_one_field_schema_bad_value] failed"
    except BaseException:
        assert True


def test_one_field_schema_bad_key():
    track = {"wrong": "ok"}
    try:
        ModelValidator.validate(to_validate=track, field="title", model="Track")
        assert False, "test_model_validator [test_one_field_schema_bad_key] failed"
    except BaseException:
        assert True


def test_one_field_schema_bad_key_and_value():
    track = {"wrong": 1}
    try:
        ModelValidator.validate(to_validate=track, field="title", model="Track")
        assert (
            False
        ), "test_model_validator [test_one_field_schema_bad_key_and_value] failed"
    except BaseException:
        assert True


def test_one_field_schema_with_additional_properties():
    track = {"title": "ok", "wrong": 1}
    try:
        ModelValidator.validate(to_validate=track, field="title", model="Track")
        assert (
            False
        ), "test_model_validator [test_one_field_schema_with_additional_properties] failed"
    except BaseException:
        assert True


def test_one_field_schema_empty_object():
    track = {}
    try:
        ModelValidator.validate(to_validate=track, field="title", model="Track")
        assert False, "test_model_validator [test_one_field_schema_empty_object] failed"
    except BaseException:
        assert True


##### Testing field validation with variation of schemas ######
def test_schema_missing():
    try:
        ModelValidator.validate(to_validate={}, field="title", model="non-existant")
        assert False, "test_model_validator [test_one_field_schema_empty_object] failed"
    except BaseException:
        assert True


def test_schema_invalid_json():
    ModelValidator.BASE_PATH = "./tests/res/"
    try:
        ModelValidator.validate(to_validate={}, field="title", model="bad")
        assert False, "test_model_validator [test_schema_invalid_json] failed"
    except BaseException:
        assert True


def test_schema_missing_model_key():
    ModelValidator.BASE_PATH = "./tests/res/"

    try:
        ModelValidator.validate(to_validate={}, field="title", model="user_bad")
        assert False, "test_model_validator [test_schema_missing_model_key] failed"
    except BaseException:
        assert True
