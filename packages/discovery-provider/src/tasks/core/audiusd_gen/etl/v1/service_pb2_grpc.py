# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

from src.tasks.core.audiusd_gen.etl.v1 import types_pb2 as etl_dot_v1_dot_types__pb2


class ETLServiceStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.Ping = channel.unary_unary(
                '/etl.v1.ETLService/Ping',
                request_serializer=etl_dot_v1_dot_types__pb2.PingRequest.SerializeToString,
                response_deserializer=etl_dot_v1_dot_types__pb2.PingResponse.FromString,
                _registered_method=True)
        self.GetHealth = channel.unary_unary(
                '/etl.v1.ETLService/GetHealth',
                request_serializer=etl_dot_v1_dot_types__pb2.GetHealthRequest.SerializeToString,
                response_deserializer=etl_dot_v1_dot_types__pb2.GetHealthResponse.FromString,
                _registered_method=True)
        self.GetPlays = channel.unary_unary(
                '/etl.v1.ETLService/GetPlays',
                request_serializer=etl_dot_v1_dot_types__pb2.GetPlaysRequest.SerializeToString,
                response_deserializer=etl_dot_v1_dot_types__pb2.GetPlaysResponse.FromString,
                _registered_method=True)


class ETLServiceServicer(object):
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

    def GetPlays(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_ETLServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'Ping': grpc.unary_unary_rpc_method_handler(
                    servicer.Ping,
                    request_deserializer=etl_dot_v1_dot_types__pb2.PingRequest.FromString,
                    response_serializer=etl_dot_v1_dot_types__pb2.PingResponse.SerializeToString,
            ),
            'GetHealth': grpc.unary_unary_rpc_method_handler(
                    servicer.GetHealth,
                    request_deserializer=etl_dot_v1_dot_types__pb2.GetHealthRequest.FromString,
                    response_serializer=etl_dot_v1_dot_types__pb2.GetHealthResponse.SerializeToString,
            ),
            'GetPlays': grpc.unary_unary_rpc_method_handler(
                    servicer.GetPlays,
                    request_deserializer=etl_dot_v1_dot_types__pb2.GetPlaysRequest.FromString,
                    response_serializer=etl_dot_v1_dot_types__pb2.GetPlaysResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'etl.v1.ETLService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('etl.v1.ETLService', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class ETLService(object):
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
            '/etl.v1.ETLService/Ping',
            etl_dot_v1_dot_types__pb2.PingRequest.SerializeToString,
            etl_dot_v1_dot_types__pb2.PingResponse.FromString,
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
            '/etl.v1.ETLService/GetHealth',
            etl_dot_v1_dot_types__pb2.GetHealthRequest.SerializeToString,
            etl_dot_v1_dot_types__pb2.GetHealthResponse.FromString,
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
    def GetPlays(request,
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
            '/etl.v1.ETLService/GetPlays',
            etl_dot_v1_dot_types__pb2.GetPlaysRequest.SerializeToString,
            etl_dot_v1_dot_types__pb2.GetPlaysResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
