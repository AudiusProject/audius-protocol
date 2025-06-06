"""
@generated by mypy-protobuf.  Do not edit manually!
isort:skip_file
"""

import builtins
import collections.abc
import ddex.v1beta1.release_pb2
import google.protobuf.descriptor
import google.protobuf.internal.containers
import google.protobuf.message
import google.protobuf.timestamp_pb2
import typing

DESCRIPTOR: google.protobuf.descriptor.FileDescriptor

@typing.final
class PingRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    def __init__(
        self,
    ) -> None: ...

global___PingRequest = PingRequest

@typing.final
class PingResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    MESSAGE_FIELD_NUMBER: builtins.int
    message: builtins.str
    def __init__(
        self,
        *,
        message: builtins.str = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["message", b"message"]) -> None: ...

global___PingResponse = PingResponse

@typing.final
class GetHealthRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    def __init__(
        self,
    ) -> None: ...

global___GetHealthRequest = GetHealthRequest

@typing.final
class GetHealthResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    def __init__(
        self,
    ) -> None: ...

global___GetHealthResponse = GetHealthResponse

@typing.final
class GetNodeInfoRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    def __init__(
        self,
    ) -> None: ...

global___GetNodeInfoRequest = GetNodeInfoRequest

@typing.final
class GetNodeInfoResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    CHAINID_FIELD_NUMBER: builtins.int
    SYNCED_FIELD_NUMBER: builtins.int
    COMET_ADDRESS_FIELD_NUMBER: builtins.int
    ETH_ADDRESS_FIELD_NUMBER: builtins.int
    CURRENT_HEIGHT_FIELD_NUMBER: builtins.int
    chainid: builtins.str
    synced: builtins.bool
    comet_address: builtins.str
    eth_address: builtins.str
    current_height: builtins.int
    def __init__(
        self,
        *,
        chainid: builtins.str = ...,
        synced: builtins.bool = ...,
        comet_address: builtins.str = ...,
        eth_address: builtins.str = ...,
        current_height: builtins.int = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["chainid", b"chainid", "comet_address", b"comet_address", "current_height", b"current_height", "eth_address", b"eth_address", "synced", b"synced"]) -> None: ...

global___GetNodeInfoResponse = GetNodeInfoResponse

@typing.final
class GetBlockRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    HEIGHT_FIELD_NUMBER: builtins.int
    height: builtins.int
    def __init__(
        self,
        *,
        height: builtins.int = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["height", b"height"]) -> None: ...

global___GetBlockRequest = GetBlockRequest

@typing.final
class GetBlockResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    BLOCK_FIELD_NUMBER: builtins.int
    CURRENT_HEIGHT_FIELD_NUMBER: builtins.int
    current_height: builtins.int
    @property
    def block(self) -> global___Block: ...
    def __init__(
        self,
        *,
        block: global___Block | None = ...,
        current_height: builtins.int = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["block", b"block"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["block", b"block", "current_height", b"current_height"]) -> None: ...

global___GetBlockResponse = GetBlockResponse

@typing.final
class GetTransactionRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    TX_HASH_FIELD_NUMBER: builtins.int
    tx_hash: builtins.str
    def __init__(
        self,
        *,
        tx_hash: builtins.str = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["tx_hash", b"tx_hash"]) -> None: ...

global___GetTransactionRequest = GetTransactionRequest

@typing.final
class GetTransactionResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    TRANSACTION_FIELD_NUMBER: builtins.int
    @property
    def transaction(self) -> global___Transaction: ...
    def __init__(
        self,
        *,
        transaction: global___Transaction | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["transaction", b"transaction"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["transaction", b"transaction"]) -> None: ...

global___GetTransactionResponse = GetTransactionResponse

@typing.final
class SendTransactionRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    TRANSACTION_FIELD_NUMBER: builtins.int
    @property
    def transaction(self) -> global___SignedTransaction: ...
    def __init__(
        self,
        *,
        transaction: global___SignedTransaction | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["transaction", b"transaction"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["transaction", b"transaction"]) -> None: ...

global___SendTransactionRequest = SendTransactionRequest

@typing.final
class SendTransactionResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    TRANSACTION_FIELD_NUMBER: builtins.int
    @property
    def transaction(self) -> global___Transaction: ...
    def __init__(
        self,
        *,
        transaction: global___Transaction | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["transaction", b"transaction"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["transaction", b"transaction"]) -> None: ...

global___SendTransactionResponse = SendTransactionResponse

@typing.final
class ForwardTransactionRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    TRANSACTION_FIELD_NUMBER: builtins.int
    @property
    def transaction(self) -> global___SignedTransaction: ...
    def __init__(
        self,
        *,
        transaction: global___SignedTransaction | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["transaction", b"transaction"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["transaction", b"transaction"]) -> None: ...

global___ForwardTransactionRequest = ForwardTransactionRequest

@typing.final
class ForwardTransactionResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    def __init__(
        self,
    ) -> None: ...

global___ForwardTransactionResponse = ForwardTransactionResponse

@typing.final
class GetRegistrationAttestationRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    REGISTRATION_FIELD_NUMBER: builtins.int
    @property
    def registration(self) -> global___ValidatorRegistration: ...
    def __init__(
        self,
        *,
        registration: global___ValidatorRegistration | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["registration", b"registration"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["registration", b"registration"]) -> None: ...

global___GetRegistrationAttestationRequest = GetRegistrationAttestationRequest

@typing.final
class GetRegistrationAttestationResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    SIGNATURE_FIELD_NUMBER: builtins.int
    REGISTRATION_FIELD_NUMBER: builtins.int
    signature: builtins.str
    @property
    def registration(self) -> global___ValidatorRegistration: ...
    def __init__(
        self,
        *,
        signature: builtins.str = ...,
        registration: global___ValidatorRegistration | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["registration", b"registration"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["registration", b"registration", "signature", b"signature"]) -> None: ...

global___GetRegistrationAttestationResponse = GetRegistrationAttestationResponse

@typing.final
class GetDeregistrationAttestationRequest(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    DEREGISTRATION_FIELD_NUMBER: builtins.int
    @property
    def deregistration(self) -> global___ValidatorDeregistration: ...
    def __init__(
        self,
        *,
        deregistration: global___ValidatorDeregistration | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["deregistration", b"deregistration"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["deregistration", b"deregistration"]) -> None: ...

global___GetDeregistrationAttestationRequest = GetDeregistrationAttestationRequest

@typing.final
class GetDeregistrationAttestationResponse(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    SIGNATURE_FIELD_NUMBER: builtins.int
    DEREGISTRATION_FIELD_NUMBER: builtins.int
    signature: builtins.str
    @property
    def deregistration(self) -> global___ValidatorDeregistration: ...
    def __init__(
        self,
        *,
        signature: builtins.str = ...,
        deregistration: global___ValidatorDeregistration | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["deregistration", b"deregistration"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["deregistration", b"deregistration", "signature", b"signature"]) -> None: ...

global___GetDeregistrationAttestationResponse = GetDeregistrationAttestationResponse

@typing.final
class Block(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    HEIGHT_FIELD_NUMBER: builtins.int
    HASH_FIELD_NUMBER: builtins.int
    CHAIN_ID_FIELD_NUMBER: builtins.int
    PROPOSER_FIELD_NUMBER: builtins.int
    TIMESTAMP_FIELD_NUMBER: builtins.int
    TRANSACTIONS_FIELD_NUMBER: builtins.int
    height: builtins.int
    hash: builtins.str
    chain_id: builtins.str
    proposer: builtins.str
    @property
    def timestamp(self) -> google.protobuf.timestamp_pb2.Timestamp: ...
    @property
    def transactions(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___Transaction]: ...
    def __init__(
        self,
        *,
        height: builtins.int = ...,
        hash: builtins.str = ...,
        chain_id: builtins.str = ...,
        proposer: builtins.str = ...,
        timestamp: google.protobuf.timestamp_pb2.Timestamp | None = ...,
        transactions: collections.abc.Iterable[global___Transaction] | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["timestamp", b"timestamp"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["chain_id", b"chain_id", "hash", b"hash", "height", b"height", "proposer", b"proposer", "timestamp", b"timestamp", "transactions", b"transactions"]) -> None: ...

global___Block = Block

@typing.final
class Transaction(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    HASH_FIELD_NUMBER: builtins.int
    TRANSACTION_FIELD_NUMBER: builtins.int
    CHAIN_ID_FIELD_NUMBER: builtins.int
    HEIGHT_FIELD_NUMBER: builtins.int
    BLOCK_HASH_FIELD_NUMBER: builtins.int
    TIMESTAMP_FIELD_NUMBER: builtins.int
    hash: builtins.str
    chain_id: builtins.str
    height: builtins.int
    block_hash: builtins.str
    @property
    def transaction(self) -> global___SignedTransaction: ...
    @property
    def timestamp(self) -> google.protobuf.timestamp_pb2.Timestamp: ...
    def __init__(
        self,
        *,
        hash: builtins.str = ...,
        transaction: global___SignedTransaction | None = ...,
        chain_id: builtins.str = ...,
        height: builtins.int = ...,
        block_hash: builtins.str = ...,
        timestamp: google.protobuf.timestamp_pb2.Timestamp | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["timestamp", b"timestamp", "transaction", b"transaction"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["block_hash", b"block_hash", "chain_id", b"chain_id", "hash", b"hash", "height", b"height", "timestamp", b"timestamp", "transaction", b"transaction"]) -> None: ...

global___Transaction = Transaction

@typing.final
class SignedTransaction(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    SIGNATURE_FIELD_NUMBER: builtins.int
    REQUEST_ID_FIELD_NUMBER: builtins.int
    PLAYS_FIELD_NUMBER: builtins.int
    VALIDATOR_REGISTRATION_FIELD_NUMBER: builtins.int
    SLA_ROLLUP_FIELD_NUMBER: builtins.int
    MANAGE_ENTITY_FIELD_NUMBER: builtins.int
    VALIDATOR_DEREGISTRATION_FIELD_NUMBER: builtins.int
    STORAGE_PROOF_FIELD_NUMBER: builtins.int
    STORAGE_PROOF_VERIFICATION_FIELD_NUMBER: builtins.int
    ATTESTATION_FIELD_NUMBER: builtins.int
    RELEASE_FIELD_NUMBER: builtins.int
    signature: builtins.str
    request_id: builtins.str
    @property
    def plays(self) -> global___TrackPlays: ...
    @property
    def validator_registration(self) -> global___ValidatorRegistrationLegacy: ...
    @property
    def sla_rollup(self) -> global___SlaRollup: ...
    @property
    def manage_entity(self) -> global___ManageEntityLegacy: ...
    @property
    def validator_deregistration(self) -> global___ValidatorMisbehaviorDeregistration: ...
    @property
    def storage_proof(self) -> global___StorageProof: ...
    @property
    def storage_proof_verification(self) -> global___StorageProofVerification: ...
    @property
    def attestation(self) -> global___Attestation: ...
    @property
    def release(self) -> ddex.v1beta1.release_pb2.NewReleaseMessage: ...
    def __init__(
        self,
        *,
        signature: builtins.str = ...,
        request_id: builtins.str = ...,
        plays: global___TrackPlays | None = ...,
        validator_registration: global___ValidatorRegistrationLegacy | None = ...,
        sla_rollup: global___SlaRollup | None = ...,
        manage_entity: global___ManageEntityLegacy | None = ...,
        validator_deregistration: global___ValidatorMisbehaviorDeregistration | None = ...,
        storage_proof: global___StorageProof | None = ...,
        storage_proof_verification: global___StorageProofVerification | None = ...,
        attestation: global___Attestation | None = ...,
        release: ddex.v1beta1.release_pb2.NewReleaseMessage | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["attestation", b"attestation", "manage_entity", b"manage_entity", "plays", b"plays", "release", b"release", "sla_rollup", b"sla_rollup", "storage_proof", b"storage_proof", "storage_proof_verification", b"storage_proof_verification", "transaction", b"transaction", "validator_deregistration", b"validator_deregistration", "validator_registration", b"validator_registration"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["attestation", b"attestation", "manage_entity", b"manage_entity", "plays", b"plays", "release", b"release", "request_id", b"request_id", "signature", b"signature", "sla_rollup", b"sla_rollup", "storage_proof", b"storage_proof", "storage_proof_verification", b"storage_proof_verification", "transaction", b"transaction", "validator_deregistration", b"validator_deregistration", "validator_registration", b"validator_registration"]) -> None: ...
    def WhichOneof(self, oneof_group: typing.Literal["transaction", b"transaction"]) -> typing.Literal["plays", "validator_registration", "sla_rollup", "manage_entity", "validator_deregistration", "storage_proof", "storage_proof_verification", "attestation", "release"] | None: ...

global___SignedTransaction = SignedTransaction

@typing.final
class TrackPlays(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    PLAYS_FIELD_NUMBER: builtins.int
    @property
    def plays(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___TrackPlay]: ...
    def __init__(
        self,
        *,
        plays: collections.abc.Iterable[global___TrackPlay] | None = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["plays", b"plays"]) -> None: ...

global___TrackPlays = TrackPlays

@typing.final
class ValidatorRegistrationLegacy(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    ENDPOINT_FIELD_NUMBER: builtins.int
    COMET_ADDRESS_FIELD_NUMBER: builtins.int
    ETH_BLOCK_FIELD_NUMBER: builtins.int
    NODE_TYPE_FIELD_NUMBER: builtins.int
    SP_ID_FIELD_NUMBER: builtins.int
    PUB_KEY_FIELD_NUMBER: builtins.int
    POWER_FIELD_NUMBER: builtins.int
    endpoint: builtins.str
    comet_address: builtins.str
    eth_block: builtins.str
    node_type: builtins.str
    sp_id: builtins.str
    pub_key: builtins.bytes
    power: builtins.int
    def __init__(
        self,
        *,
        endpoint: builtins.str = ...,
        comet_address: builtins.str = ...,
        eth_block: builtins.str = ...,
        node_type: builtins.str = ...,
        sp_id: builtins.str = ...,
        pub_key: builtins.bytes = ...,
        power: builtins.int = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["comet_address", b"comet_address", "endpoint", b"endpoint", "eth_block", b"eth_block", "node_type", b"node_type", "power", b"power", "pub_key", b"pub_key", "sp_id", b"sp_id"]) -> None: ...

global___ValidatorRegistrationLegacy = ValidatorRegistrationLegacy

@typing.final
class TrackPlay(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    USER_ID_FIELD_NUMBER: builtins.int
    TRACK_ID_FIELD_NUMBER: builtins.int
    TIMESTAMP_FIELD_NUMBER: builtins.int
    SIGNATURE_FIELD_NUMBER: builtins.int
    CITY_FIELD_NUMBER: builtins.int
    REGION_FIELD_NUMBER: builtins.int
    COUNTRY_FIELD_NUMBER: builtins.int
    user_id: builtins.str
    track_id: builtins.str
    signature: builtins.str
    city: builtins.str
    region: builtins.str
    country: builtins.str
    @property
    def timestamp(self) -> google.protobuf.timestamp_pb2.Timestamp: ...
    def __init__(
        self,
        *,
        user_id: builtins.str = ...,
        track_id: builtins.str = ...,
        timestamp: google.protobuf.timestamp_pb2.Timestamp | None = ...,
        signature: builtins.str = ...,
        city: builtins.str = ...,
        region: builtins.str = ...,
        country: builtins.str = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["timestamp", b"timestamp"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["city", b"city", "country", b"country", "region", b"region", "signature", b"signature", "timestamp", b"timestamp", "track_id", b"track_id", "user_id", b"user_id"]) -> None: ...

global___TrackPlay = TrackPlay

@typing.final
class SlaRollup(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    TIMESTAMP_FIELD_NUMBER: builtins.int
    BLOCK_START_FIELD_NUMBER: builtins.int
    BLOCK_END_FIELD_NUMBER: builtins.int
    REPORTS_FIELD_NUMBER: builtins.int
    block_start: builtins.int
    block_end: builtins.int
    @property
    def timestamp(self) -> google.protobuf.timestamp_pb2.Timestamp: ...
    @property
    def reports(self) -> google.protobuf.internal.containers.RepeatedCompositeFieldContainer[global___SlaNodeReport]: ...
    def __init__(
        self,
        *,
        timestamp: google.protobuf.timestamp_pb2.Timestamp | None = ...,
        block_start: builtins.int = ...,
        block_end: builtins.int = ...,
        reports: collections.abc.Iterable[global___SlaNodeReport] | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["timestamp", b"timestamp"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["block_end", b"block_end", "block_start", b"block_start", "reports", b"reports", "timestamp", b"timestamp"]) -> None: ...

global___SlaRollup = SlaRollup

@typing.final
class SlaNodeReport(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    ADDRESS_FIELD_NUMBER: builtins.int
    NUM_BLOCKS_PROPOSED_FIELD_NUMBER: builtins.int
    address: builtins.str
    num_blocks_proposed: builtins.int
    def __init__(
        self,
        *,
        address: builtins.str = ...,
        num_blocks_proposed: builtins.int = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["address", b"address", "num_blocks_proposed", b"num_blocks_proposed"]) -> None: ...

global___SlaNodeReport = SlaNodeReport

@typing.final
class ManageEntityLegacy(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    USER_ID_FIELD_NUMBER: builtins.int
    ENTITY_TYPE_FIELD_NUMBER: builtins.int
    ENTITY_ID_FIELD_NUMBER: builtins.int
    ACTION_FIELD_NUMBER: builtins.int
    METADATA_FIELD_NUMBER: builtins.int
    SIGNATURE_FIELD_NUMBER: builtins.int
    SIGNER_FIELD_NUMBER: builtins.int
    NONCE_FIELD_NUMBER: builtins.int
    user_id: builtins.int
    entity_type: builtins.str
    entity_id: builtins.int
    action: builtins.str
    metadata: builtins.str
    signature: builtins.str
    signer: builtins.str
    nonce: builtins.str
    def __init__(
        self,
        *,
        user_id: builtins.int = ...,
        entity_type: builtins.str = ...,
        entity_id: builtins.int = ...,
        action: builtins.str = ...,
        metadata: builtins.str = ...,
        signature: builtins.str = ...,
        signer: builtins.str = ...,
        nonce: builtins.str = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["action", b"action", "entity_id", b"entity_id", "entity_type", b"entity_type", "metadata", b"metadata", "nonce", b"nonce", "signature", b"signature", "signer", b"signer", "user_id", b"user_id"]) -> None: ...

global___ManageEntityLegacy = ManageEntityLegacy

@typing.final
class ValidatorMisbehaviorDeregistration(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    COMET_ADDRESS_FIELD_NUMBER: builtins.int
    PUB_KEY_FIELD_NUMBER: builtins.int
    comet_address: builtins.str
    pub_key: builtins.bytes
    def __init__(
        self,
        *,
        comet_address: builtins.str = ...,
        pub_key: builtins.bytes = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["comet_address", b"comet_address", "pub_key", b"pub_key"]) -> None: ...

global___ValidatorMisbehaviorDeregistration = ValidatorMisbehaviorDeregistration

@typing.final
class StorageProof(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    HEIGHT_FIELD_NUMBER: builtins.int
    ADDRESS_FIELD_NUMBER: builtins.int
    PROVER_ADDRESSES_FIELD_NUMBER: builtins.int
    CID_FIELD_NUMBER: builtins.int
    PROOF_SIGNATURE_FIELD_NUMBER: builtins.int
    height: builtins.int
    address: builtins.str
    cid: builtins.str
    proof_signature: builtins.bytes
    @property
    def prover_addresses(self) -> google.protobuf.internal.containers.RepeatedScalarFieldContainer[builtins.str]: ...
    def __init__(
        self,
        *,
        height: builtins.int = ...,
        address: builtins.str = ...,
        prover_addresses: collections.abc.Iterable[builtins.str] | None = ...,
        cid: builtins.str = ...,
        proof_signature: builtins.bytes = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["address", b"address", "cid", b"cid", "height", b"height", "proof_signature", b"proof_signature", "prover_addresses", b"prover_addresses"]) -> None: ...

global___StorageProof = StorageProof

@typing.final
class StorageProofVerification(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    HEIGHT_FIELD_NUMBER: builtins.int
    PROOF_FIELD_NUMBER: builtins.int
    height: builtins.int
    proof: builtins.bytes
    def __init__(
        self,
        *,
        height: builtins.int = ...,
        proof: builtins.bytes = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["height", b"height", "proof", b"proof"]) -> None: ...

global___StorageProofVerification = StorageProofVerification

@typing.final
class Attestation(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    SIGNATURES_FIELD_NUMBER: builtins.int
    VALIDATOR_REGISTRATION_FIELD_NUMBER: builtins.int
    VALIDATOR_DEREGISTRATION_FIELD_NUMBER: builtins.int
    @property
    def signatures(self) -> google.protobuf.internal.containers.RepeatedScalarFieldContainer[builtins.str]: ...
    @property
    def validator_registration(self) -> global___ValidatorRegistration: ...
    @property
    def validator_deregistration(self) -> global___ValidatorDeregistration: ...
    def __init__(
        self,
        *,
        signatures: collections.abc.Iterable[builtins.str] | None = ...,
        validator_registration: global___ValidatorRegistration | None = ...,
        validator_deregistration: global___ValidatorDeregistration | None = ...,
    ) -> None: ...
    def HasField(self, field_name: typing.Literal["body", b"body", "validator_deregistration", b"validator_deregistration", "validator_registration", b"validator_registration"]) -> builtins.bool: ...
    def ClearField(self, field_name: typing.Literal["body", b"body", "signatures", b"signatures", "validator_deregistration", b"validator_deregistration", "validator_registration", b"validator_registration"]) -> None: ...
    def WhichOneof(self, oneof_group: typing.Literal["body", b"body"]) -> typing.Literal["validator_registration", "validator_deregistration"] | None: ...

global___Attestation = Attestation

@typing.final
class ValidatorRegistration(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    DELEGATE_WALLET_FIELD_NUMBER: builtins.int
    ENDPOINT_FIELD_NUMBER: builtins.int
    NODE_TYPE_FIELD_NUMBER: builtins.int
    SP_ID_FIELD_NUMBER: builtins.int
    ETH_BLOCK_FIELD_NUMBER: builtins.int
    COMET_ADDRESS_FIELD_NUMBER: builtins.int
    PUB_KEY_FIELD_NUMBER: builtins.int
    POWER_FIELD_NUMBER: builtins.int
    DEADLINE_FIELD_NUMBER: builtins.int
    delegate_wallet: builtins.str
    endpoint: builtins.str
    node_type: builtins.str
    sp_id: builtins.str
    eth_block: builtins.int
    comet_address: builtins.str
    pub_key: builtins.bytes
    power: builtins.int
    deadline: builtins.int
    def __init__(
        self,
        *,
        delegate_wallet: builtins.str = ...,
        endpoint: builtins.str = ...,
        node_type: builtins.str = ...,
        sp_id: builtins.str = ...,
        eth_block: builtins.int = ...,
        comet_address: builtins.str = ...,
        pub_key: builtins.bytes = ...,
        power: builtins.int = ...,
        deadline: builtins.int = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["comet_address", b"comet_address", "deadline", b"deadline", "delegate_wallet", b"delegate_wallet", "endpoint", b"endpoint", "eth_block", b"eth_block", "node_type", b"node_type", "power", b"power", "pub_key", b"pub_key", "sp_id", b"sp_id"]) -> None: ...

global___ValidatorRegistration = ValidatorRegistration

@typing.final
class ValidatorDeregistration(google.protobuf.message.Message):
    DESCRIPTOR: google.protobuf.descriptor.Descriptor

    COMET_ADDRESS_FIELD_NUMBER: builtins.int
    PUB_KEY_FIELD_NUMBER: builtins.int
    DEADLINE_FIELD_NUMBER: builtins.int
    comet_address: builtins.str
    pub_key: builtins.bytes
    deadline: builtins.int
    def __init__(
        self,
        *,
        comet_address: builtins.str = ...,
        pub_key: builtins.bytes = ...,
        deadline: builtins.int = ...,
    ) -> None: ...
    def ClearField(self, field_name: typing.Literal["comet_address", b"comet_address", "deadline", b"deadline", "pub_key", b"pub_key"]) -> None: ...

global___ValidatorDeregistration = ValidatorDeregistration
