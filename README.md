<img src="https://avatars1.githubusercontent.com/u/38231615?s=400&u=c00678880596dabd2746dae13a47edbe7ea7210e&v=4" width="150px" >

---

# audius-protocol
Audius is working to create a fully decentralized community of artists, developers, and listeners collaborating to share and defend the world’s music.

This repository encompasses all of the services, contracts and libs that comprise the Audius protocol.

### Audius Services

| Service                                                        | Description                                                                                       
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------
| [`creator-node`](creator-node)                  | Maintains the availability of users' content on IPFS including user metadata, images, and audio content
| [`discovery-provider`](discovery-provider)      | Indexes and stores the contents of the audius contracts on the ethereum blockchain for clients to query via an API
| [`identity-service`](identity-service)          | Stores encrypted auth ciphertexts, does Twitter oauth and relays transactions on behalf of users
| [`content-service`](content-service)            | Monitors Audius activity and intelligently caches content to increase availability

### Audius Smart Contracts & Libs

| Lib                                                        | Description                                                                                       
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------
| [`libs`](https://github.com/AudiusProject/audius-protocol/tree/master/libs)     | An easy interface to the distributed web and audius services: Identity Service, Discovery Provider, Creator Node
| [`contracts`](https://github.com/AudiusProject/audius-protocol/tree/master/contracts)         | The smart contracts being developed for the audius streaming protocol
| [`eth-contracts`](https://github.com/AudiusProject/audius-protocol/tree/master/eth-contracts) | The ethereum smart contracts being developed for the audius streaming protocol
