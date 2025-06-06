// @generated by protoc-gen-es v2.2.3 with parameter "target=ts"
// @generated from file system/v1/types.proto (package system.v1, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import type { GetHealthResponse as GetHealthResponse$1, PingResponse as PingResponse$1 } from "../../core/v1/types_pb";
import { file_core_v1_types } from "../../core/v1/types_pb";
import type { GetHealthResponse as GetHealthResponse$3, PingResponse as PingResponse$3 } from "../../etl/v1/types_pb";
import { file_etl_v1_types } from "../../etl/v1/types_pb";
import type { GetHealthResponse as GetHealthResponse$2, PingResponse as PingResponse$2 } from "../../storage/v1/types_pb";
import { file_storage_v1_types } from "../../storage/v1/types_pb";
import type { Message } from "@bufbuild/protobuf";

/**
 * Describes the file system/v1/types.proto.
 */
export const file_system_v1_types: GenFile = /*@__PURE__*/
  fileDesc("ChVzeXN0ZW0vdjEvdHlwZXMucHJvdG8SCXN5c3RlbS52MSINCgtQaW5nUmVxdWVzdCKhAQoMUGluZ1Jlc3BvbnNlEg8KB21lc3NhZ2UYASABKAkSKAoJY29yZV9waW5nGAIgASgLMhUuY29yZS52MS5QaW5nUmVzcG9uc2USLgoMc3RvcmFnZV9waW5nGAMgASgLMhguc3RvcmFnZS52MS5QaW5nUmVzcG9uc2USJgoIZXRsX3BpbmcYBCABKAsyFC5ldGwudjEuUGluZ1Jlc3BvbnNlIhIKEEdldEhlYWx0aFJlcXVlc3QiugEKEUdldEhlYWx0aFJlc3BvbnNlEg4KBnN0YXR1cxgBIAEoCRIvCgtjb3JlX2hlYWx0aBgCIAEoCzIaLmNvcmUudjEuR2V0SGVhbHRoUmVzcG9uc2USNQoOc3RvcmFnZV9oZWFsdGgYAyABKAsyHS5zdG9yYWdlLnYxLkdldEhlYWx0aFJlc3BvbnNlEi0KCmV0bF9oZWFsdGgYBCABKAsyGS5ldGwudjEuR2V0SGVhbHRoUmVzcG9uc2VCNFoyZ2l0aHViLmNvbS9BdWRpdXNQcm9qZWN0L2F1ZGl1c2QvcGtnL2FwaS9zeXN0ZW0vdjFiBnByb3RvMw", [file_core_v1_types, file_etl_v1_types, file_storage_v1_types]);

/**
 * @generated from message system.v1.PingRequest
 */
export type PingRequest = Message<"system.v1.PingRequest"> & {
};

/**
 * Describes the message system.v1.PingRequest.
 * Use `create(PingRequestSchema)` to create a new message.
 */
export const PingRequestSchema: GenMessage<PingRequest> = /*@__PURE__*/
  messageDesc(file_system_v1_types, 0);

/**
 * @generated from message system.v1.PingResponse
 */
export type PingResponse = Message<"system.v1.PingResponse"> & {
  /**
   * @generated from field: string message = 1;
   */
  message: string;

  /**
   * @generated from field: core.v1.PingResponse core_ping = 2;
   */
  corePing?: PingResponse$1;

  /**
   * @generated from field: storage.v1.PingResponse storage_ping = 3;
   */
  storagePing?: PingResponse$2;

  /**
   * @generated from field: etl.v1.PingResponse etl_ping = 4;
   */
  etlPing?: PingResponse$3;
};

/**
 * Describes the message system.v1.PingResponse.
 * Use `create(PingResponseSchema)` to create a new message.
 */
export const PingResponseSchema: GenMessage<PingResponse> = /*@__PURE__*/
  messageDesc(file_system_v1_types, 1);

/**
 * @generated from message system.v1.GetHealthRequest
 */
export type GetHealthRequest = Message<"system.v1.GetHealthRequest"> & {
};

/**
 * Describes the message system.v1.GetHealthRequest.
 * Use `create(GetHealthRequestSchema)` to create a new message.
 */
export const GetHealthRequestSchema: GenMessage<GetHealthRequest> = /*@__PURE__*/
  messageDesc(file_system_v1_types, 2);

/**
 * @generated from message system.v1.GetHealthResponse
 */
export type GetHealthResponse = Message<"system.v1.GetHealthResponse"> & {
  /**
   * @generated from field: string status = 1;
   */
  status: string;

  /**
   * @generated from field: core.v1.GetHealthResponse core_health = 2;
   */
  coreHealth?: GetHealthResponse$1;

  /**
   * @generated from field: storage.v1.GetHealthResponse storage_health = 3;
   */
  storageHealth?: GetHealthResponse$2;

  /**
   * @generated from field: etl.v1.GetHealthResponse etl_health = 4;
   */
  etlHealth?: GetHealthResponse$3;
};

/**
 * Describes the message system.v1.GetHealthResponse.
 * Use `create(GetHealthResponseSchema)` to create a new message.
 */
export const GetHealthResponseSchema: GenMessage<GetHealthResponse> = /*@__PURE__*/
  messageDesc(file_system_v1_types, 3);

