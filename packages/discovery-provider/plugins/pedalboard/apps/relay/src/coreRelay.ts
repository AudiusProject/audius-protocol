import { ethers } from "ethers";
import { decodeAbi } from "./abi.js";
import { ProtocolClient } from "./core-sdk/protocol_grpc_pb.js";
import { ManageEntityLegacy, SendTransactionRequest, SignedTransaction } from "./core-sdk/protocol_pb.js";
import { ValidatedRelayRequest } from "./types/relay";
import * as grpc from '@grpc/grpc-js';
import { error } from "console";

export const coreRelay = async (requestId: string, request: ValidatedRelayRequest) => {
  try {
    const client = new ProtocolClient("core-discovery-1:50051", grpc.credentials.createInsecure())

    const { encodedABI } = request

    const { userId: userIdBig, entityId: entityIdBig, entityType, action, metadata: metadataAny, subjectSig } = decodeAbi(encodedABI)
    const userId = userIdBig.toNumber()
    const entityId = entityIdBig.toNumber()
    const metadata = JSON.stringify(metadataAny)
    const signature = ethers.utils.hexlify(subjectSig)

    const manageEntity = new ManageEntityLegacy()
    manageEntity.setUserId(userId)
    manageEntity.setEntityId(entityId)
    manageEntity.setEntityType(entityType)
    manageEntity.setAction(action)
    manageEntity.setMetadata(metadata)
    manageEntity.setSignature(signature)

    const signedTransaction = new SignedTransaction()
    signedTransaction.setSignature(signature)
    signedTransaction.setManageEntity(manageEntity)
    signedTransaction.setRequestId(requestId)

    const sendRequest = new SendTransactionRequest()
    sendRequest.setTransaction(signedTransaction)

    client.sendTransaction(sendRequest, (error, res) => {
      if (error) {
        console.error("core relay error:", error)
        return
      }
      console.log("core relay response:", res.toObject())
    })
  } catch (e) {
    console.error("core relay failure:", error)
  }
}
