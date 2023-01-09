import * as secp from "npm:@noble/secp256k1";
import * as aes from "npm:micro-aes-gcm";
import { Address } from "npm:micro-eth-signer";
import { keccak_256 } from "npm:@noble/hashes/sha3";
import { base64 } from "npm:@scure/base";
import * as cuid from "npm:cuid";
import {
  ChatSayParams,
  ChatCreateParams,
  ChatReadParams,
  MutationMethod,
  QueryMethod,
} from "../schema/schema.ts";

type KeyPair = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  walletAddress: string;
};

function generatePrivateKey(): KeyPair {
  const privateKey = secp.utils.randomPrivateKey();
  const publicKey = secp.getPublicKey(privateKey);
  const walletAddress = Address.fromPrivateKey(privateKey);

  return {
    privateKey,
    publicKey,
    walletAddress,
  };
}

// function printKeyPair(kp: KeyPair) {
//   console.log("----");
//   console.log(" privateKey:", bytesToHex(kp.privateKey));
//   console.log(" publicKey:", bytesToHex(kp.publicKey));
//   console.log(" walletAddress:", kp.walletAddress);
//   console.log("----");
// }

async function signedJson(obj: unknown, privateKey: Uint8Array) {
  const payload = JSON.stringify(obj);

  const msgHash = keccak_256(payload);
  const [sig, recid] = await secp.sign(msgHash, privateKey, {
    recovered: true,
    der: false,
  });

  const sigBytes = new Uint8Array(65);
  sigBytes.set(sig, 0);
  sigBytes[64] = recid;

  return [payload, base64.encode(sigBytes)];
}

// -------------------------------------------------------------------------------

type RPC = {
  method: QueryMethod | MutationMethod;
  params: Record<string, any>;
};

class RPCClient {
  host = "http://localhost:8925";

  // cache of chat secrets (should be a promise for lookup)
  private chatSecrets: Record<string, Promise<Uint8Array>> = {};

  // cache of user pubkey lookups
  userPubkeys: Record<number, Promise<Uint8Array>> = {};

  constructor(public userId: number, private kp: KeyPair) {}

  publicKey() {
    return this.kp.publicKey;
  }

  // fetch stuff
  mutate(rpc: RPC) {
    const endpoint = `${this.host}/comms/mutate`;
    return this.post(endpoint, rpc);
  }

  query(rpc: RPC) {
    const endpoint = `${this.host}/comms/query`;
    return this.post(endpoint, rpc);
  }

  // chat specific apis
  async chatCreate(userIds: number[]) {
    // ensure my userId is in the list
    if (userIds.indexOf(this.userId) == -1) {
      userIds.push(this.userId);
    }

    const chatId = cuid.default();

    // if we wanted to de-dupe chats the id could be derived from members
    // but this makes testing harder atm
    // userIds.sort();
    // const chatId = userIds.join(",");

    const chatSecret = secp.utils.randomPrivateKey();

    // a stateful chat client should store `chatId: chatSecret`
    // for reading + sending messages later
    // might make sense to use react-query for this
    this.chatSecrets[chatId] = Promise.resolve(chatSecret);

    // for each invited user:
    //   get pubkey
    //   build invite code
    const invites = await Promise.all(
      userIds.map(async (userId) => {
        // todo: need to handle errors and filter userIds for those with valid pubkey
        // todo: would also be nice to have a bulk endpoint here
        const pubkey = await this.getPubkey(userId);
        const inviteCode = base64.encode(
          await this.makeInviteCode(pubkey, chatSecret)
        );
        return { userId, inviteCode };
      })
    );

    const params: ChatCreateParams = {
      chatId,
      invites,
    };

    await this.mutate({
      method: "chat.create",
      params,
    });

    return chatId;
  }

  async chatSay(chatId: string, message: string) {
    // need to get my invite for chatId
    // recover the chat secret
    // use it to encrypt message

    const chatSecret = await this.getChatSecret(chatId);

    const params: ChatSayParams = {
      chatId: chatId,
      ciphertext: base64.encode(await aes.encrypt(chatSecret, message)),
    };

    this.mutate({
      method: "chat.say",
      params,
    });
  }

  async chatRead(chatId: string) {
    const params: ChatReadParams = {
      chatId: chatId
    }

    this.mutate({
      method: "chat.read",
      params
    })
  }

  // key stuff
  encryptFor(friendPublicKey: Uint8Array, payload: Uint8Array) {
    const shared = this.sharedSecret(friendPublicKey);
    return aes.encrypt(shared, payload);
  }

  decryptFrom(friendPublicKey: Uint8Array, payload: Uint8Array) {
    const shared = this.sharedSecret(friendPublicKey);
    if (!shared) {
      console.log("no shared secret from", friendPublicKey);
    }
    return aes.decrypt(shared, payload);
  }

  async makeInviteCode(friendPubkey: Uint8Array, payload: Uint8Array) {
    const encrypted = await this.encryptFor(friendPubkey, payload);
    const packed = new Uint8Array(65 + encrypted.length);
    packed.set(this.kp.publicKey);
    packed.set(encrypted, 65);
    return packed;
  }

  readInviteCode(inviteCode: Uint8Array) {
    const friend = inviteCode.slice(0, 65);
    const code = inviteCode.slice(65);
    return this.decryptFrom(friend, code);
  }

  private sharedSecret(friendPublicKey: Uint8Array) {
    const shared = secp.getSharedSecret(
      this.kp.privateKey,
      friendPublicKey,
      true
    );
    return shared.slice(shared.length - 32);
  }

  private getPubkey(userId: number): Promise<Uint8Array> {
    if (!this.userPubkeys[userId]) {
      this.userPubkeys[userId] = this.fetchPubkey(userId);
    }
    return this.userPubkeys[userId];
  }

  private async fetchPubkey(userId: number) {
    const resp = await fetch(`${this.host}/comms/pubkey/${userId}`);
    const txt = await resp.text();
    return base64.decode(txt);
  }

  private getChatSecret(chatId: string): Promise<Uint8Array> {
    if (!this.chatSecrets[chatId]) {
      this.chatSecrets[chatId] = this.query({
        method: "chat.get",
        params: { chatId },
      }).then((data) => {
        return this.readInviteCode(base64.decode(data.invite_code));
      });
    }
    return this.chatSecrets[chatId];
  }

  private async post(endpoint: string, rpc: RPC) {
    // "lax mode" hack because wallets are not in db
    // normally the server would read sig, find wallet, find user
    // this allows the client to simply specify a user ID
    // since there's no easy way for deno client to "seed" db with users
    // that it has the keypair for... but I have an idea about how to do that.
    //
    // also this is inlined to the JSON body (instead of being a header) because the nats processor uses it also.
    // it could still be a header if the `mutate` endpoint took the HTTP header and copied it to NATS message header.
    rpc.params.tempUserId = this.userId;

    const [payload, sigBase64] = await signedJson(rpc, this.kp.privateKey);

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-sig": sigBase64,
      },
      body: payload,
    });

    if (resp.status != 200) {
      const txt = await resp.text();
      const message = [endpoint, resp.status, txt].join(" ");
      throw new Error(message);
    }

    return await resp.json();
  }
}

// -------------------------------------------------------------

// need two users with keys in the db that can be recovered / verified
// steve = 91
// dave = 92
// steve creates chat
// steve invites dave
// sends message
// check counts, etc.

const steve = new RPCClient(91, generatePrivateKey());
const dave = new RPCClient(92, generatePrivateKey());
const bill = new RPCClient(93, generatePrivateKey());

// hack to socialize public keys between all our users
// since deno client doesn't have an easy way to create test users
const allUsers = [steve, dave, bill];
for (const u of allUsers) {
  for (const v of allUsers) {
    u.userPubkeys[v.userId] = Promise.resolve(v.publicKey());
  }
}

const chatId = await steve.chatCreate([91, 92]);
await new Promise((r) => setTimeout(r, 1000));

await steve.chatSay(chatId, "hello dave");

await dave.chatSay(chatId, "hi there steve");

await dave.chatSay(chatId, "hello???");

await new Promise((r) => setTimeout(r, 1000));

await steve.chatRead(chatId)

await new Promise((r) => setTimeout(r, 1000));

await dave.chatSay(chatId, "heyyyyyyyyy");

await new Promise((r) => setTimeout(r, 500));

// list latest chat for users
for (const client of [steve, dave]) {
  const userId = client.userId;
  console.log(`------------- ${userId}`);

  const threads = await client.query({
    method: "chat.list",
    params: {},
  });
  const lastThread = threads[threads.length - 1];

  if (lastThread.chat_id !== chatId) {
    console.log("got different thread", chatId);
  }
  console.log(`${userId} lastThread`, lastThread);

  // the thread invite_code is packed structure with: (invitor_public_key, encrypted_shared_secret)
  // use the invitor_public_key to get a secp256k1 shared secret
  // use that shared secret to decrypt the chat shared secret
  const sharedSecret2 = await client.readInviteCode(
    base64.decode(lastThread.invite_code)
  );

  console.log("invite", lastThread.invite_code.length);

  const messages = await client.query({
    method: "chat.messages",
    params: {
      chatId: chatId,
    },
  });

  for (const message of messages) {
    // use sharedSecret2 recovered from invite_code to decrypt messages
    const decrypted = await aes.decrypt(
      sharedSecret2,
      base64.decode(message.ciphertext)
    );
    const cleartext = new TextDecoder().decode(decrypted);

    console.log(message.user_id, ":", cleartext);
  }
}

// test validator by sending an invalid payload
try {
  await dave.mutate({
    method: "chat.say",
    params: {
      foo: "bar",
    },
  });
} catch (e) {
  console.log("OK validator rejection: ", e.message);
}

// test validator: non-member trys to chat in a thread
try {
  await bill.chatSay(chatId, "bill here crashing the party");
} catch (e) {
  console.log("OK validator rejection: ", e.message);
}
