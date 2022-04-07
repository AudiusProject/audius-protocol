const config = require('./config')
const solanaWeb3 = require('@solana/web3.js')
const keccak256 = require('keccak256')
const secp256k1 = require('secp256k1')
const borsh = require('borsh')

const VALID_SIGNER = config.get('solanaValidSigner')
const AUDIUS_ETH_REGISTRY_PROGRAM = config.get('solanaAudiusEthRegistryAddress') ? new solanaWeb3.PublicKey(
  config.get('solanaAudiusEthRegistryAddress')
) : null
const TRACK_LISTEN_PROGRAM = config.get('solanaTrackListenCountAddress') ? new solanaWeb3.PublicKey(
  config.get('solanaTrackListenCountAddress')
) : null
const INSTRUCTIONS_PROGRAM = new solanaWeb3.PublicKey(
  'Sysvar1nstructions1111111111111111111111111'
)
const CLOCK_PROGRAM = new solanaWeb3.PublicKey(
  'SysvarC1ock11111111111111111111111111111111'
)

class TrackData {
  constructor ({ userId, trackId, source, timestamp }) {
    this.userId = userId
    this.trackId = trackId
    this.source = source
    this.timestamp = timestamp
  }
}

class InstructionArgs {
  constructor ({ trackData, signature, recoveryId }) {
    this.trackData = trackData
    this.signature = signature
    this.recoveryId = recoveryId
  }
}

class InstructionEnum {
  constructor ({ instruction, choose }) {
    this.instruction = instruction
    this.choose = choose
  }
}

const trackDataSchema = new Map([
  [
    TrackData,
    {
      kind: 'struct',
      fields: [
        ['userId', 'string'],
        ['trackId', 'string'],
        ['source', 'string'],
        ['timestamp', 'u64']
      ]
    }
  ]
])

const instructionSchema = new Map([
  [
    InstructionEnum,
    {
      kind: 'enum',
      field: 'choose',
      values: [['instruction', InstructionArgs]]
    }
  ],
  [
    InstructionArgs,
    {
      kind: 'struct',
      fields: [
        ['trackData', TrackData],
        ['signature', [64]],
        ['recoveryId', 'u8']
      ]
    }
  ],
  [
    TrackData,
    {
      kind: 'struct',
      fields: [
        ['userId', 'string'],
        ['trackId', 'string'],
        ['source', 'string'],
        ['timestamp', 'u64']
      ]
    }
  ]
])

let feePayerKeypair = null
let feePayerKeypairs = null

// Optionally returns the existing singleFeePayer
// Ensures other usages of this function do not break as we upgrade to multiple
function getFeePayerKeypair (singleFeePayer = true) {
  if (!feePayerKeypairs) {
    feePayerKeypairs = config.get('solanaFeePayerWallets')
      ? config.get('solanaFeePayerWallets')
        .map(item => item.privateKey)
        .map(key => solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(key)))
      : null
  }
  if (!feePayerKeypair) {
    feePayerKeypair = (feePayerKeypairs && feePayerKeypairs[0]) || null
  }
  // Ensure legacy usage of single feePayer is not broken
  // If multiple feepayers are not provided, default to single value as well
  if (singleFeePayer || feePayerKeypairs === null || feePayerKeypairs.length === 0) {
    return feePayerKeypair
  }

  const randomFeePayerIndex = Math.floor(Math.random() * feePayerKeypairs.length)
  return feePayerKeypairs[randomFeePayerIndex]
}

async function createAndVerifyMessage (
  connection,
  validSigner,
  privateKey,
  userId,
  trackId,
  source
) {
  validSigner = validSigner || VALID_SIGNER

  let privKey = Buffer.from(privateKey, 'hex')
  let pubKey = secp256k1.publicKeyCreate(privKey, false).slice(1)

  let validSignerPubK = new solanaWeb3.PublicKey(validSigner)
  let accInfo = await connection.getAccountInfo(validSignerPubK)
  let signerGroup = new solanaWeb3.PublicKey(
    accInfo.data.toJSON().data.slice(1, 33)
  ) // cut off version and eth address from valid signer data

  let trackData = new TrackData({
    userId: userId,
    trackId: trackId,
    source: source,
    timestamp: Math.round(new Date().getTime() / 1000)
  })

  const serializedTrackData = borsh.serialize(trackDataSchema, trackData)
  let msgHash = keccak256(serializedTrackData.toJSON().data)

  const sigObj = secp256k1.ecdsaSign(Uint8Array.from(msgHash), privKey)

  let instructionArgs = new InstructionArgs({
    trackData: trackData,
    signature: Array.from(sigObj.signature),
    recoveryId: sigObj.recid
  })

  let instructionData = new InstructionEnum({
    instruction: instructionArgs,
    choose: 'instruction'
  })

  const serializedInstructionArgs = borsh.serialize(
    instructionSchema,
    instructionData
  )

  let transaction = new solanaWeb3.Transaction()

  let secpInstruction = solanaWeb3.Secp256k1Program.createInstructionWithPublicKey(
    {
      publicKey: pubKey,
      message: serializedTrackData.toJSON().data,
      signature: sigObj.signature,
      recoveryId: sigObj.recid
    }
  )

  transaction.add(secpInstruction)

  transaction.add({
    keys: [
      { pubkey: validSignerPubK, isSigner: false, isWritable: false },
      { pubkey: signerGroup, isSigner: false, isWritable: false },
      { pubkey: AUDIUS_ETH_REGISTRY_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: INSTRUCTIONS_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: CLOCK_PROGRAM, isSigner: false, isWritable: false }
    ],
    programId: TRACK_LISTEN_PROGRAM,
    data: serializedInstructionArgs
  })

  let feePayerAccount = getFeePayerKeypair(false)
  let signature = await sendAndSignTransaction(connection, transaction, feePayerAccount)

  return signature
}

const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

// Adapted from mango send function
// https://github.com/blockworks-foundation/mango-ui/blob/b6abfc6c13b71fc17ebbe766f50b8215fa1ec54f/src/utils/send.tsx#L785
async function sendAndSignTransaction (connection, transaction, signers) {
  let recentBlockHash = (await connection.getRecentBlockhash('confirmed')).blockhash
  transaction.recentBlockhash = recentBlockHash

  transaction.sign(signers)
  let rawTransaction = transaction.serialize()
  const startTime = getUnixTs();
  const txid = await connection.sendRawTransaction(
    rawTransaction,
    {
      skipPreflight: true,
    },
  );

  // Anonymous function to retry sending until confirmation
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      await sleep(300);
    }
  })();

  try {
    awaitTransactionSignatureConfirmation(txid, 1000, connection)
  } catch(e) {
    throw new Error(e)
  } finally {
    done = true
  }
  return txid
}

async function awaitTransactionSignatureConfirmation(
  txid,
  timeout,
  connection,
) {
  let done = false;
  const result = await new Promise((resolve, reject) => {
    (async () => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        console.log('Timed out for txid', txid);
        reject({ timeout: true });
      }, timeout);
      try {
        connection.onSignature(
          txid,
          (result) => {
            console.log('WS confirmed', txid, result);
            done = true;
            if (result.err) {
              reject(result.err);
            } else {
              resolve(result);
            }
          },
          connection.commitment,
        );
        console.log('Set up WS connection', txid);
      } catch (e) {
        done = true;
        console.log('WS error in setup', txid, e);
      }
      while (!done) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            const result = signatureStatuses && signatureStatuses.value[0];
            if (!done) {

              if (!result) {
                // console.log('REST null result for', txid, result);
              } else if (result.err) {
                console.log('REST error for', txid, result);
                done = true;
                reject(result.err);
              }
              // @ts-ignore
              else if (!(result.confirmations || result.confirmationStatus === "confirmed" || result.confirmationStatus === "finalized")) {
                console.log('REST not confirmed', txid, result);
              } else {
                console.log('REST confirmed', txid, result);
                done = true;
                resolve(result);
              }
            }
          }
          catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e);
            }
          }
        })();
        await sleep(300);
      }
    })();
  });
  done = true;
  return result;
}

exports.createAndVerifyMessage = createAndVerifyMessage
exports.getFeePayerKeypair = getFeePayerKeypair
