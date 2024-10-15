// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var protocol_pb = require('./protocol_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');

function serialize_protocol_GetTransactionRequest(arg) {
  if (!(arg instanceof protocol_pb.GetTransactionRequest)) {
    throw new Error('Expected argument of type protocol.GetTransactionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_protocol_GetTransactionRequest(buffer_arg) {
  return protocol_pb.GetTransactionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_protocol_PingRequest(arg) {
  if (!(arg instanceof protocol_pb.PingRequest)) {
    throw new Error('Expected argument of type protocol.PingRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_protocol_PingRequest(buffer_arg) {
  return protocol_pb.PingRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_protocol_PingResponse(arg) {
  if (!(arg instanceof protocol_pb.PingResponse)) {
    throw new Error('Expected argument of type protocol.PingResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_protocol_PingResponse(buffer_arg) {
  return protocol_pb.PingResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_protocol_SendTransactionRequest(arg) {
  if (!(arg instanceof protocol_pb.SendTransactionRequest)) {
    throw new Error('Expected argument of type protocol.SendTransactionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_protocol_SendTransactionRequest(buffer_arg) {
  return protocol_pb.SendTransactionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_protocol_TransactionResponse(arg) {
  if (!(arg instanceof protocol_pb.TransactionResponse)) {
    throw new Error('Expected argument of type protocol.TransactionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_protocol_TransactionResponse(buffer_arg) {
  return protocol_pb.TransactionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var ProtocolService = exports.ProtocolService = {
  sendTransaction: {
    path: '/protocol.Protocol/SendTransaction',
    requestStream: false,
    responseStream: false,
    requestType: protocol_pb.SendTransactionRequest,
    responseType: protocol_pb.TransactionResponse,
    requestSerialize: serialize_protocol_SendTransactionRequest,
    requestDeserialize: deserialize_protocol_SendTransactionRequest,
    responseSerialize: serialize_protocol_TransactionResponse,
    responseDeserialize: deserialize_protocol_TransactionResponse,
  },
  getTransaction: {
    path: '/protocol.Protocol/GetTransaction',
    requestStream: false,
    responseStream: false,
    requestType: protocol_pb.GetTransactionRequest,
    responseType: protocol_pb.TransactionResponse,
    requestSerialize: serialize_protocol_GetTransactionRequest,
    requestDeserialize: deserialize_protocol_GetTransactionRequest,
    responseSerialize: serialize_protocol_TransactionResponse,
    responseDeserialize: deserialize_protocol_TransactionResponse,
  },
  ping: {
    path: '/protocol.Protocol/Ping',
    requestStream: false,
    responseStream: false,
    requestType: protocol_pb.PingRequest,
    responseType: protocol_pb.PingResponse,
    requestSerialize: serialize_protocol_PingRequest,
    requestDeserialize: deserialize_protocol_PingRequest,
    responseSerialize: serialize_protocol_PingResponse,
    responseDeserialize: deserialize_protocol_PingResponse,
  },
};

exports.ProtocolClient = grpc.makeGenericClientConstructor(ProtocolService);
