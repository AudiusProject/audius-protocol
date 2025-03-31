// package: protocol
// file: protocol.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from '@grpc/grpc-js'
import * as protocol_pb from './protocol_pb'
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'

interface IProtocolService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  sendTransaction: IProtocolService_ISendTransaction
  getTransaction: IProtocolService_IGetTransaction
  ping: IProtocolService_IPing
}

interface IProtocolService_ISendTransaction
  extends grpc.MethodDefinition<
    protocol_pb.SendTransactionRequest,
    protocol_pb.TransactionResponse
  > {
  path: '/protocol.Protocol/SendTransaction'
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<protocol_pb.SendTransactionRequest>
  requestDeserialize: grpc.deserialize<protocol_pb.SendTransactionRequest>
  responseSerialize: grpc.serialize<protocol_pb.TransactionResponse>
  responseDeserialize: grpc.deserialize<protocol_pb.TransactionResponse>
}
interface IProtocolService_IGetTransaction
  extends grpc.MethodDefinition<
    protocol_pb.GetTransactionRequest,
    protocol_pb.TransactionResponse
  > {
  path: '/protocol.Protocol/GetTransaction'
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<protocol_pb.GetTransactionRequest>
  requestDeserialize: grpc.deserialize<protocol_pb.GetTransactionRequest>
  responseSerialize: grpc.serialize<protocol_pb.TransactionResponse>
  responseDeserialize: grpc.deserialize<protocol_pb.TransactionResponse>
}
interface IProtocolService_IPing
  extends grpc.MethodDefinition<
    protocol_pb.PingRequest,
    protocol_pb.PingResponse
  > {
  path: '/protocol.Protocol/Ping'
  requestStream: false
  responseStream: false
  requestSerialize: grpc.serialize<protocol_pb.PingRequest>
  requestDeserialize: grpc.deserialize<protocol_pb.PingRequest>
  responseSerialize: grpc.serialize<protocol_pb.PingResponse>
  responseDeserialize: grpc.deserialize<protocol_pb.PingResponse>
}

export const ProtocolService: IProtocolService

export interface IProtocolServer {
  sendTransaction: grpc.handleUnaryCall<
    protocol_pb.SendTransactionRequest,
    protocol_pb.TransactionResponse
  >
  getTransaction: grpc.handleUnaryCall<
    protocol_pb.GetTransactionRequest,
    protocol_pb.TransactionResponse
  >
  ping: grpc.handleUnaryCall<protocol_pb.PingRequest, protocol_pb.PingResponse>
}

export interface IProtocolClient {
  sendTransaction(
    request: protocol_pb.SendTransactionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  sendTransaction(
    request: protocol_pb.SendTransactionRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  sendTransaction(
    request: protocol_pb.SendTransactionRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  getTransaction(
    request: protocol_pb.GetTransactionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  getTransaction(
    request: protocol_pb.GetTransactionRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  getTransaction(
    request: protocol_pb.GetTransactionRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  ping(
    request: protocol_pb.PingRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.PingResponse
    ) => void
  ): grpc.ClientUnaryCall
  ping(
    request: protocol_pb.PingRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.PingResponse
    ) => void
  ): grpc.ClientUnaryCall
  ping(
    request: protocol_pb.PingRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.PingResponse
    ) => void
  ): grpc.ClientUnaryCall
}

export class ProtocolClient extends grpc.Client implements IProtocolClient {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: object
  )
  public sendTransaction(
    request: protocol_pb.SendTransactionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  public sendTransaction(
    request: protocol_pb.SendTransactionRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  public sendTransaction(
    request: protocol_pb.SendTransactionRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  public getTransaction(
    request: protocol_pb.GetTransactionRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  public getTransaction(
    request: protocol_pb.GetTransactionRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  public getTransaction(
    request: protocol_pb.GetTransactionRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.TransactionResponse
    ) => void
  ): grpc.ClientUnaryCall
  public ping(
    request: protocol_pb.PingRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.PingResponse
    ) => void
  ): grpc.ClientUnaryCall
  public ping(
    request: protocol_pb.PingRequest,
    metadata: grpc.Metadata,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.PingResponse
    ) => void
  ): grpc.ClientUnaryCall
  public ping(
    request: protocol_pb.PingRequest,
    metadata: grpc.Metadata,
    options: Partial<grpc.CallOptions>,
    callback: (
      error: grpc.ServiceError | null,
      response: protocol_pb.PingResponse
    ) => void
  ): grpc.ClientUnaryCall
}
