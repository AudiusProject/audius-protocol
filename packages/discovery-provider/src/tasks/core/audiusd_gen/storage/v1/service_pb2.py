# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: storage/v1/service.proto
# Protobuf Python Version: 5.28.3
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    28,
    3,
    '',
    'storage/v1/service.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from src.tasks.core.audiusd_gen.storage.v1 import types_pb2 as storage_dot_v1_dot_types__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x18storage/v1/service.proto\x12\nstorage.v1\x1a\x16storage/v1/types.proto2\xdc\x03\n\x0eStorageService\x12;\n\x04Ping\x12\x17.storage.v1.PingRequest\x1a\x18.storage.v1.PingResponse\"\x00\x12J\n\tGetHealth\x12\x1c.storage.v1.GetHealthRequest\x1a\x1d.storage.v1.GetHealthResponse\"\x00\x12M\n\nGetUploads\x12\x1d.storage.v1.GetUploadsRequest\x1a\x1e.storage.v1.GetUploadsResponse\"\x00\x12J\n\tGetUpload\x12\x1c.storage.v1.GetUploadRequest\x1a\x1d.storage.v1.GetUploadResponse\"\x00\x12R\n\x0bStreamTrack\x12\x1e.storage.v1.StreamTrackRequest\x1a\x1f.storage.v1.StreamTrackResponse\"\x00\x30\x01\x12R\n\x0bStreamImage\x12\x1e.storage.v1.StreamImageRequest\x1a\x1f.storage.v1.StreamImageResponse\"\x00\x30\x01\x42\x35Z3github.com/AudiusProject/audiusd/pkg/api/storage/v1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'storage.v1.service_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z3github.com/AudiusProject/audiusd/pkg/api/storage/v1'
  _globals['_STORAGESERVICE']._serialized_start=65
  _globals['_STORAGESERVICE']._serialized_end=541
# @@protoc_insertion_point(module_scope)
