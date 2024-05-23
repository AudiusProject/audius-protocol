import { hashMessage, keccak256, recoverAddress, toUtf8Bytes } from "ethers"

// just for quick testing
const main = async () => {
    // dev values
    const nodes = [{ "endpoint": "http://audius-protocol-creator-node-1", "delegateOwnerWallet": "0x0D38e653eC28bdea5A2296fD5940aaB2D0B8875c" }, { "endpoint": "http://audius-protocol-creator-node-2", "delegateOwnerWallet": "0x1B569e8f1246907518Ff3386D523dcF373e769B6" }, { "endpoint": "http://audius-protocol-creator-node-3", "delegateOwnerWallet": "0xCBB025e7933FADfc7C830AE520Fb2FD6D28c1065" }]

    const ogTimestamp = "2024-05-23T19:04:46Z"
    const ogSignature = "0x2d7bc03ecd6d4a47261d0ab01c3f3f0b2a6e0489295204bc420ff0f98337515b530f2e2d755d93bf02ea31b305cef03d9bcb6a88f0faa6ac10381a42ec4407da01"

    // https://github.com/AudiusProject/audius-protocol/blob/main/mediorum/server/signature/signature.go#L99
    const signature = new Uint8Array(Buffer.from(ogSignature.slice(2), 'hex'))
    // https://github.com/AudiusProject/audius-protocol/blob/main/mediorum/server/signature/signature.go#L92
    const data = JSON.stringify({ "data": "listen", "timestamp": ogTimestamp })

    // https://github.com/AudiusProject/audius-protocol/blob/main/mediorum/server/signature/signature.go#L109
    const byteData = toUtf8Bytes(data)
    // https://github.com/AudiusProject/audius-protocol/blob/main/mediorum/server/signature/signature.go#L114
    const hashData = keccak256(byteData)
    // https://github.com/AudiusProject/audius-protocol/blob/main/mediorum/server/signature/signature.go#L117
    const hash2Data = hashMessage(hashData)

     const recoveredAddress = recoverAddress(hash2Data, ogSignature.slice(2))

    console.log({ recoveredAddress, nodes })
}

main().then(() => process.exit(0)).catch(e => {
    console.error(e)
    process.exit(1)
})

export { }
