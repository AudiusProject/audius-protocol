# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

from src.tasks.core.audiusd_gen.storage.v1 import types_pb2 as storage_dot_v1_dot_types__pb2


class StorageServiceStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.Ping = channel.unary_unary(
                '/storage.v1.StorageService/Ping',
                request_serializer=storage_dot_v1_dot_types__pb2.PingRequest.SerializeToString,
                response_deserializer=storage_dot_v1_dot_types__pb2.PingResponse.FromString,
                _registered_method=True)
        self.GetHealth = channel.unary_unary(
                '/storage.v1.StorageService/GetHealth',
                request_serializer=storage_dot_v1_dot_types__pb2.GetHealthRequest.SerializeToString,
                response_deserializer=storage_dot_v1_dot_types__pb2.GetHealthResponse.FromString,
                _registered_method=True)
        self.GetUploads = channel.unary_unary(
                '/storage.v1.StorageService/GetUploads',
                request_serializer=storage_dot_v1_dot_types__pb2.GetUploadsRequest.SerializeToString,
                response_deserializer=storage_dot_v1_dot_types__pb2.GetUploadsResponse.FromString,
                _registered_method=True)
        self.GetUpload = channel.unary_unary(
                '/storage.v1.StorageService/GetUpload',
                request_serializer=storage_dot_v1_dot_types__pb2.GetUploadRequest.SerializeToString,
                response_deserializer=storage_dot_v1_dot_types__pb2.GetUploadResponse.FromString,
                _registered_method=True)
        self.StreamTrack = channel.unary_stream(
                '/storage.v1.StorageService/StreamTrack',
                request_serializer=storage_dot_v1_dot_types__pb2.StreamTrackRequest.SerializeToString,
                response_deserializer=storage_dot_v1_dot_types__pb2.StreamTrackResponse.FromString,
                _registered_method=True)
        self.StreamImage = channel.unary_stream(
                '/storage.v1.StorageService/StreamImage',
                request_serializer=storage_dot_v1_dot_types__pb2.StreamImageRequest.SerializeToString,
                response_deserializer=storage_dot_v1_dot_types__pb2.StreamImageResponse.FromString,
                _registered_method=True)


class StorageServiceServicer(object):
    """Missing associated documentation comment in .proto file."""

    def Ping(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetHealth(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetUploads(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def GetUpload(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def StreamTrack(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def StreamImage(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_StorageServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'Ping': grpc.unary_unary_rpc_method_handler(
                    servicer.Ping,
                    request_deserializer=storage_dot_v1_dot_types__pb2.PingRequest.FromString,
                    response_serializer=storage_dot_v1_dot_types__pb2.PingResponse.SerializeToString,
            ),
            'GetHealth': grpc.unary_unary_rpc_method_handler(
                    servicer.GetHealth,
                    request_deserializer=storage_dot_v1_dot_types__pb2.GetHealthRequest.FromString,
                    response_serializer=storage_dot_v1_dot_types__pb2.GetHealthResponse.SerializeToString,
            ),
            'GetUploads': grpc.unary_unary_rpc_method_handler(
                    servicer.GetUploads,
                    request_deserializer=storage_dot_v1_dot_types__pb2.GetUploadsRequest.FromString,
                    response_serializer=storage_dot_v1_dot_types__pb2.GetUploadsResponse.SerializeToString,
            ),
            'GetUpload': grpc.unary_unary_rpc_method_handler(
                    servicer.GetUpload,
                    request_deserializer=storage_dot_v1_dot_types__pb2.GetUploadRequest.FromString,
                    response_serializer=storage_dot_v1_dot_types__pb2.GetUploadResponse.SerializeToString,
            ),
            'StreamTrack': grpc.unary_stream_rpc_method_handler(
                    servicer.StreamTrack,
                    request_deserializer=storage_dot_v1_dot_types__pb2.StreamTrackRequest.FromString,
                    response_serializer=storage_dot_v1_dot_types__pb2.StreamTrackResponse.SerializeToString,
            ),
            'StreamImage': grpc.unary_stream_rpc_method_handler(
                    servicer.StreamImage,
                    request_deserializer=storage_dot_v1_dot_types__pb2.StreamImageRequest.FromString,
                    response_serializer=storage_dot_v1_dot_types__pb2.StreamImageResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'storage.v1.StorageService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('storage.v1.StorageService', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class StorageService(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def Ping(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/storage.v1.StorageService/Ping',
            storage_dot_v1_dot_types__pb2.PingRequest.SerializeToString,
            storage_dot_v1_dot_types__pb2.PingResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def GetHealth(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/storage.v1.StorageService/GetHealth',
            storage_dot_v1_dot_types__pb2.GetHealthRequest.SerializeToString,
            storage_dot_v1_dot_types__pb2.GetHealthResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def GetUploads(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/storage.v1.StorageService/GetUploads',
            storage_dot_v1_dot_types__pb2.GetUploadsRequest.SerializeToString,
            storage_dot_v1_dot_types__pb2.GetUploadsResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def GetUpload(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/storage.v1.StorageService/GetUpload',
            storage_dot_v1_dot_types__pb2.GetUploadRequest.SerializeToString,
            storage_dot_v1_dot_types__pb2.GetUploadResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def StreamTrack(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_stream(
            request,
            target,
            '/storage.v1.StorageService/StreamTrack',
            storage_dot_v1_dot_types__pb2.StreamTrackRequest.SerializeToString,
            storage_dot_v1_dot_types__pb2.StreamTrackResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)

    @staticmethod
    def StreamImage(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_stream(
            request,
            target,
            '/storage.v1.StorageService/StreamImage',
            storage_dot_v1_dot_types__pb2.StreamImageRequest.SerializeToString,
            storage_dot_v1_dot_types__pb2.StreamImageResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
