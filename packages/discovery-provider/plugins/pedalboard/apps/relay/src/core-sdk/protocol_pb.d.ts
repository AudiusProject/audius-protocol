// package: protocol
// file: protocol.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

export class SignedTransaction extends jspb.Message { 
    getSignature(): string;
    setSignature(value: string): SignedTransaction;
    getRequestId(): string;
    setRequestId(value: string): SignedTransaction;

    hasPlays(): boolean;
    clearPlays(): void;
    getPlays(): TrackPlays | undefined;
    setPlays(value?: TrackPlays): SignedTransaction;

    hasValidatorRegistration(): boolean;
    clearValidatorRegistration(): void;
    getValidatorRegistration(): ValidatorRegistration | undefined;
    setValidatorRegistration(value?: ValidatorRegistration): SignedTransaction;

    hasSlaRollup(): boolean;
    clearSlaRollup(): void;
    getSlaRollup(): SlaRollup | undefined;
    setSlaRollup(value?: SlaRollup): SignedTransaction;

    hasManageEntity(): boolean;
    clearManageEntity(): void;
    getManageEntity(): ManageEntityLegacy | undefined;
    setManageEntity(value?: ManageEntityLegacy): SignedTransaction;

    getTransactionCase(): SignedTransaction.TransactionCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SignedTransaction.AsObject;
    static toObject(includeInstance: boolean, msg: SignedTransaction): SignedTransaction.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SignedTransaction, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SignedTransaction;
    static deserializeBinaryFromReader(message: SignedTransaction, reader: jspb.BinaryReader): SignedTransaction;
}

export namespace SignedTransaction {
    export type AsObject = {
        signature: string,
        requestId: string,
        plays?: TrackPlays.AsObject,
        validatorRegistration?: ValidatorRegistration.AsObject,
        slaRollup?: SlaRollup.AsObject,
        manageEntity?: ManageEntityLegacy.AsObject,
    }

    export enum TransactionCase {
        TRANSACTION_NOT_SET = 0,
        PLAYS = 1000,
        VALIDATOR_REGISTRATION = 1001,
        SLA_ROLLUP = 1002,
        MANAGE_ENTITY = 1003,
    }

}

export class SendTransactionRequest extends jspb.Message { 

    hasTransaction(): boolean;
    clearTransaction(): void;
    getTransaction(): SignedTransaction | undefined;
    setTransaction(value?: SignedTransaction): SendTransactionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SendTransactionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SendTransactionRequest): SendTransactionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SendTransactionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SendTransactionRequest;
    static deserializeBinaryFromReader(message: SendTransactionRequest, reader: jspb.BinaryReader): SendTransactionRequest;
}

export namespace SendTransactionRequest {
    export type AsObject = {
        transaction?: SignedTransaction.AsObject,
    }
}

export class GetTransactionRequest extends jspb.Message { 
    getTxhash(): string;
    setTxhash(value: string): GetTransactionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetTransactionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetTransactionRequest): GetTransactionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetTransactionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetTransactionRequest;
    static deserializeBinaryFromReader(message: GetTransactionRequest, reader: jspb.BinaryReader): GetTransactionRequest;
}

export namespace GetTransactionRequest {
    export type AsObject = {
        txhash: string,
    }
}

export class TransactionResponse extends jspb.Message { 
    getTxhash(): string;
    setTxhash(value: string): TransactionResponse;

    hasTransaction(): boolean;
    clearTransaction(): void;
    getTransaction(): SignedTransaction | undefined;
    setTransaction(value?: SignedTransaction): TransactionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TransactionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TransactionResponse): TransactionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TransactionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TransactionResponse;
    static deserializeBinaryFromReader(message: TransactionResponse, reader: jspb.BinaryReader): TransactionResponse;
}

export namespace TransactionResponse {
    export type AsObject = {
        txhash: string,
        transaction?: SignedTransaction.AsObject,
    }
}

export class TrackPlays extends jspb.Message { 
    clearPlaysList(): void;
    getPlaysList(): Array<TrackPlay>;
    setPlaysList(value: Array<TrackPlay>): TrackPlays;
    addPlays(value?: TrackPlay, index?: number): TrackPlay;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TrackPlays.AsObject;
    static toObject(includeInstance: boolean, msg: TrackPlays): TrackPlays.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TrackPlays, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TrackPlays;
    static deserializeBinaryFromReader(message: TrackPlays, reader: jspb.BinaryReader): TrackPlays;
}

export namespace TrackPlays {
    export type AsObject = {
        playsList: Array<TrackPlay.AsObject>,
    }
}

export class ValidatorRegistration extends jspb.Message { 
    getEndpoint(): string;
    setEndpoint(value: string): ValidatorRegistration;
    getCometAddress(): string;
    setCometAddress(value: string): ValidatorRegistration;
    getEthBlock(): string;
    setEthBlock(value: string): ValidatorRegistration;
    getNodeType(): string;
    setNodeType(value: string): ValidatorRegistration;
    getSpId(): string;
    setSpId(value: string): ValidatorRegistration;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ValidatorRegistration.AsObject;
    static toObject(includeInstance: boolean, msg: ValidatorRegistration): ValidatorRegistration.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ValidatorRegistration, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ValidatorRegistration;
    static deserializeBinaryFromReader(message: ValidatorRegistration, reader: jspb.BinaryReader): ValidatorRegistration;
}

export namespace ValidatorRegistration {
    export type AsObject = {
        endpoint: string,
        cometAddress: string,
        ethBlock: string,
        nodeType: string,
        spId: string,
    }
}

export class TrackPlay extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): TrackPlay;
    getTrackId(): string;
    setTrackId(value: string): TrackPlay;

    hasTimestamp(): boolean;
    clearTimestamp(): void;
    getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): TrackPlay;
    getSignature(): string;
    setSignature(value: string): TrackPlay;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TrackPlay.AsObject;
    static toObject(includeInstance: boolean, msg: TrackPlay): TrackPlay.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TrackPlay, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TrackPlay;
    static deserializeBinaryFromReader(message: TrackPlay, reader: jspb.BinaryReader): TrackPlay;
}

export namespace TrackPlay {
    export type AsObject = {
        userId: string,
        trackId: string,
        timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        signature: string,
    }
}

export class PingRequest extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PingRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PingRequest): PingRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PingRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PingRequest;
    static deserializeBinaryFromReader(message: PingRequest, reader: jspb.BinaryReader): PingRequest;
}

export namespace PingRequest {
    export type AsObject = {
    }
}

export class PingResponse extends jspb.Message { 
    getMessage(): string;
    setMessage(value: string): PingResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PingResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PingResponse): PingResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PingResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PingResponse;
    static deserializeBinaryFromReader(message: PingResponse, reader: jspb.BinaryReader): PingResponse;
}

export namespace PingResponse {
    export type AsObject = {
        message: string,
    }
}

export class SlaRollup extends jspb.Message { 

    hasTimestamp(): boolean;
    clearTimestamp(): void;
    getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): SlaRollup;
    getBlockStart(): number;
    setBlockStart(value: number): SlaRollup;
    getBlockEnd(): number;
    setBlockEnd(value: number): SlaRollup;
    clearReportsList(): void;
    getReportsList(): Array<SlaNodeReport>;
    setReportsList(value: Array<SlaNodeReport>): SlaRollup;
    addReports(value?: SlaNodeReport, index?: number): SlaNodeReport;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SlaRollup.AsObject;
    static toObject(includeInstance: boolean, msg: SlaRollup): SlaRollup.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SlaRollup, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SlaRollup;
    static deserializeBinaryFromReader(message: SlaRollup, reader: jspb.BinaryReader): SlaRollup;
}

export namespace SlaRollup {
    export type AsObject = {
        timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        blockStart: number,
        blockEnd: number,
        reportsList: Array<SlaNodeReport.AsObject>,
    }
}

export class SlaNodeReport extends jspb.Message { 
    getAddress(): string;
    setAddress(value: string): SlaNodeReport;
    getNumBlocksProposed(): number;
    setNumBlocksProposed(value: number): SlaNodeReport;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SlaNodeReport.AsObject;
    static toObject(includeInstance: boolean, msg: SlaNodeReport): SlaNodeReport.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SlaNodeReport, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SlaNodeReport;
    static deserializeBinaryFromReader(message: SlaNodeReport, reader: jspb.BinaryReader): SlaNodeReport;
}

export namespace SlaNodeReport {
    export type AsObject = {
        address: string,
        numBlocksProposed: number,
    }
}

export class ManageEntityLegacy extends jspb.Message { 
    getUserId(): number;
    setUserId(value: number): ManageEntityLegacy;
    getEntityType(): string;
    setEntityType(value: string): ManageEntityLegacy;
    getEntityId(): number;
    setEntityId(value: number): ManageEntityLegacy;
    getAction(): string;
    setAction(value: string): ManageEntityLegacy;
    getMetadata(): string;
    setMetadata(value: string): ManageEntityLegacy;
    getSignature(): string;
    setSignature(value: string): ManageEntityLegacy;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ManageEntityLegacy.AsObject;
    static toObject(includeInstance: boolean, msg: ManageEntityLegacy): ManageEntityLegacy.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ManageEntityLegacy, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ManageEntityLegacy;
    static deserializeBinaryFromReader(message: ManageEntityLegacy, reader: jspb.BinaryReader): ManageEntityLegacy;
}

export namespace ManageEntityLegacy {
    export type AsObject = {
        userId: number,
        entityType: string,
        entityId: number,
        action: string,
        metadata: string,
        signature: string,
    }
}
