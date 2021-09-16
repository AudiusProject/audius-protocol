# About

Audius Reward Manager will be a program which allows trusted node operators (identified by their Ethereum Addresses) to distribute rewards to the users.

# Operation

Node operators (or senders) will be using their own business logic to identify which users need to be rewarded with tokens. Each reward can be sent to the user only once, so there will be a unique identifier (called `specifier`) ensuring just a single payout. Also the reward payout can happen only if several senders agree on it (3 for example).

There is also a separate type of the sender called `anti abuse oracle`. This will be a sender operated by Audius and while any 3 senders can sign the reward transfer, all transfers also require a signature by the `anti abuse oracle` and messages from the senders also should specify the same `anti abuse oracle` address.

After signatures from 3 senders and `anti abuse oracle` are verified the tokens are transferred and we create and maintain a `transfer` record which will store an account in the blockchain derived from the `specifier` ensuring no other transfer with the same ID happens again.

All the signatures are verified using secp256k1 instruction (several of them for several signatures).
