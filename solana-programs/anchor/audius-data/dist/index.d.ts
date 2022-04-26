import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';
import { Account } from 'web3-core';

declare type AudiusData = {
    "version": "0.1.0";
    "name": "audius_data";
    "instructions": [
        {
            "name": "initAdmin";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "authority";
                    "type": "publicKey";
                },
                {
                    "name": "verifier";
                    "type": "publicKey";
                }
            ];
            "returns": null;
        },
        {
            "name": "updateIsVerified";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "user";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "verifier";
                    "isMut": false;
                    "isSigner": true;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "userIdSeedBump";
                    "type": {
                        "defined": "UserIdSeedBump";
                    };
                }
            ];
            "returns": null;
        },
        {
            "name": "initUser";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "cn1";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "cn2";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "cn3";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authority";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "ethAddress";
                    "type": {
                        "array": [
                            "u8",
                            20
                        ];
                    };
                },
                {
                    "name": "replicaSet";
                    "type": {
                        "array": [
                            "u16",
                            3
                        ];
                    };
                },
                {
                    "name": "replicaSetBumps";
                    "type": {
                        "array": [
                            "u8",
                            3
                        ];
                    };
                },
                {
                    "name": "userId";
                    "type": "u32";
                },
                {
                    "name": "userBump";
                    "type": "u8";
                },
                {
                    "name": "metadata";
                    "type": "string";
                }
            ];
            "returns": null;
        },
        {
            "name": "createContentNode";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "contentNode";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "spId";
                    "type": "u16";
                },
                {
                    "name": "authority";
                    "type": "publicKey";
                },
                {
                    "name": "ownerEthAddress";
                    "type": {
                        "array": [
                            "u8",
                            20
                        ];
                    };
                }
            ];
            "returns": null;
        },
        {
            "name": "publicCreateOrUpdateContentNode";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "contentNode";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "proposer1";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "proposer1Authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "proposer2";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "proposer2Authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "proposer3";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "proposer3Authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "p1";
                    "type": {
                        "defined": "ProposerSeedBump";
                    };
                },
                {
                    "name": "p2";
                    "type": {
                        "defined": "ProposerSeedBump";
                    };
                },
                {
                    "name": "p3";
                    "type": {
                        "defined": "ProposerSeedBump";
                    };
                },
                {
                    "name": "spId";
                    "type": "u16";
                },
                {
                    "name": "authority";
                    "type": "publicKey";
                },
                {
                    "name": "ownerEthAddress";
                    "type": {
                        "array": [
                            "u8",
                            20
                        ];
                    };
                }
            ];
            "returns": null;
        },
        {
            "name": "publicDeleteContentNode";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "adminAuthority";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "contentNode";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "proposer1";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "proposer1Authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "proposer2";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "proposer2Authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "proposer3";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "proposer3Authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "pDelete";
                    "type": {
                        "defined": "ProposerSeedBump";
                    };
                },
                {
                    "name": "p1";
                    "type": {
                        "defined": "ProposerSeedBump";
                    };
                },
                {
                    "name": "p2";
                    "type": {
                        "defined": "ProposerSeedBump";
                    };
                },
                {
                    "name": "p3";
                    "type": {
                        "defined": "ProposerSeedBump";
                    };
                }
            ];
            "returns": null;
        },
        {
            "name": "updateUserReplicaSet";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "cn1";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "cn2";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "cn3";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "cnAuthority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "userIdSeedBump";
                    "type": {
                        "defined": "UserIdSeedBump";
                    };
                },
                {
                    "name": "replicaSet";
                    "type": {
                        "array": [
                            "u16",
                            3
                        ];
                    };
                },
                {
                    "name": "replicaSetBumps";
                    "type": {
                        "array": [
                            "u8",
                            3
                        ];
                    };
                }
            ];
            "returns": null;
        },
        {
            "name": "initUserSol";
            "accounts": [
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "sysvarProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "userAuthority";
                    "type": "publicKey";
                }
            ];
            "returns": null;
        },
        {
            "name": "createUser";
            "accounts": [
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "cn1";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "cn2";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "cn3";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "admin";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "sysvarProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "ethAddress";
                    "type": {
                        "array": [
                            "u8",
                            20
                        ];
                    };
                },
                {
                    "name": "replicaSet";
                    "type": {
                        "array": [
                            "u16",
                            3
                        ];
                    };
                },
                {
                    "name": "replicaSetBumps";
                    "type": {
                        "array": [
                            "u8",
                            3
                        ];
                    };
                },
                {
                    "name": "userId";
                    "type": "u32";
                },
                {
                    "name": "userBump";
                    "type": "u8";
                },
                {
                    "name": "metadata";
                    "type": "string";
                },
                {
                    "name": "userAuthority";
                    "type": "publicKey";
                }
            ];
            "returns": null;
        },
        {
            "name": "updateUser";
            "accounts": [
                {
                    "name": "user";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "userAuthority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "userAuthorityDelegate";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authorityDelegationStatus";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "metadata";
                    "type": "string";
                }
            ];
            "returns": null;
        },
        {
            "name": "updateAdmin";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "adminAuthority";
                    "isMut": true;
                    "isSigner": true;
                }
            ];
            "args": [
                {
                    "name": "isWriteEnabled";
                    "type": "bool";
                }
            ];
            "returns": null;
        },
        {
            "name": "manageEntity";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "user";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "userAuthorityDelegate";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authorityDelegationStatus";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "userIdSeedBump";
                    "type": {
                        "defined": "UserIdSeedBump";
                    };
                },
                {
                    "name": "entityType";
                    "type": {
                        "defined": "EntityTypes";
                    };
                },
                {
                    "name": "managementAction";
                    "type": {
                        "defined": "ManagementActions";
                    };
                },
                {
                    "name": "id";
                    "type": "u64";
                },
                {
                    "name": "metadata";
                    "type": "string";
                }
            ];
            "returns": null;
        },
        {
            "name": "writeEntitySocialAction";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "user";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "userAuthorityDelegate";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authorityDelegationStatus";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "userIdSeedBump";
                    "type": {
                        "defined": "UserIdSeedBump";
                    };
                },
                {
                    "name": "entitySocialAction";
                    "type": {
                        "defined": "EntitySocialActionValues";
                    };
                },
                {
                    "name": "entityType";
                    "type": {
                        "defined": "EntityTypes";
                    };
                },
                {
                    "name": "id";
                    "type": "string";
                }
            ];
            "returns": null;
        },
        {
            "name": "writeUserSocialAction";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "sourceUserStorage";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "targetUserStorage";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "userAuthorityDelegate";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authorityDelegationStatus";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authority";
                    "isMut": true;
                    "isSigner": true;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "userAction";
                    "type": {
                        "defined": "UserAction";
                    };
                },
                {
                    "name": "sourceUserIdSeedBump";
                    "type": {
                        "defined": "UserIdSeedBump";
                    };
                },
                {
                    "name": "targetUserIdSeedBump";
                    "type": {
                        "defined": "UserIdSeedBump";
                    };
                }
            ];
            "returns": null;
        },
        {
            "name": "initAuthorityDelegationStatus";
            "accounts": [
                {
                    "name": "delegateAuthority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "authorityDelegationStatusPda";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "authorityName";
                    "type": "string";
                }
            ];
            "returns": null;
        },
        {
            "name": "revokeAuthorityDelegation";
            "accounts": [
                {
                    "name": "delegateAuthority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "authorityDelegationStatusPda";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "authorityDelegationBump";
                    "type": "u8";
                }
            ];
            "returns": null;
        },
        {
            "name": "addUserAuthorityDelegate";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "user";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "currentUserAuthorityDelegate";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "signerUserAuthorityDelegate";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authorityDelegationStatus";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "userIdSeedBump";
                    "type": {
                        "defined": "UserIdSeedBump";
                    };
                },
                {
                    "name": "delegatePubkey";
                    "type": "publicKey";
                }
            ];
            "returns": null;
        },
        {
            "name": "removeUserAuthorityDelegate";
            "accounts": [
                {
                    "name": "admin";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "user";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "currentUserAuthorityDelegate";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "signerUserAuthorityDelegate";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authorityDelegationStatus";
                    "isMut": false;
                    "isSigner": false;
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "payer";
                    "isMut": true;
                    "isSigner": true;
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [
                {
                    "name": "base";
                    "type": "publicKey";
                },
                {
                    "name": "userIdSeedBump";
                    "type": {
                        "defined": "UserIdSeedBump";
                    };
                },
                {
                    "name": "userAuthorityDelegate";
                    "type": "publicKey";
                },
                {
                    "name": "delegateBump";
                    "type": "u8";
                }
            ];
            "returns": null;
        }
    ];
    "accounts": [
        {
            "name": "audiusAdmin";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "authority";
                        "type": "publicKey";
                    },
                    {
                        "name": "verifier";
                        "type": "publicKey";
                    },
                    {
                        "name": "isWriteEnabled";
                        "type": "bool";
                    }
                ];
            };
        },
        {
            "name": "user";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "ethAddress";
                        "type": {
                            "array": [
                                "u8",
                                20
                            ];
                        };
                    },
                    {
                        "name": "authority";
                        "type": "publicKey";
                    },
                    {
                        "name": "replicaSet";
                        "type": {
                            "array": [
                                "u16",
                                3
                            ];
                        };
                    }
                ];
            };
        },
        {
            "name": "contentNode";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "ownerEthAddress";
                        "type": {
                            "array": [
                                "u8",
                                20
                            ];
                        };
                    },
                    {
                        "name": "authority";
                        "type": "publicKey";
                    }
                ];
            };
        },
        {
            "name": "userAuthorityDelegate";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "delegateAuthority";
                        "type": "publicKey";
                    },
                    {
                        "name": "userStorageAccount";
                        "type": "publicKey";
                    }
                ];
            };
        },
        {
            "name": "authorityDelegationStatus";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "isRevoked";
                        "type": "bool";
                    }
                ];
            };
        }
    ];
    "types": [
        {
            "name": "UserIdSeedBump";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "userId";
                        "type": "u32";
                    },
                    {
                        "name": "bump";
                        "type": "u8";
                    }
                ];
            };
        },
        {
            "name": "ProposerSeedBump";
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "seed";
                        "type": {
                            "array": [
                                "u8",
                                7
                            ];
                        };
                    },
                    {
                        "name": "bump";
                        "type": "u8";
                    }
                ];
            };
        },
        {
            "name": "UserAction";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "FollowUser";
                    },
                    {
                        "name": "UnfollowUser";
                    },
                    {
                        "name": "SubscribeUser";
                    },
                    {
                        "name": "UnsubscribeUser";
                    }
                ];
            };
        },
        {
            "name": "EntitySocialActionValues";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "AddSave";
                    },
                    {
                        "name": "DeleteSave";
                    },
                    {
                        "name": "AddRepost";
                    },
                    {
                        "name": "DeleteRepost";
                    }
                ];
            };
        },
        {
            "name": "ManagementActions";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "Create";
                    },
                    {
                        "name": "Update";
                    },
                    {
                        "name": "Delete";
                    }
                ];
            };
        },
        {
            "name": "EntityTypes";
            "type": {
                "kind": "enum";
                "variants": [
                    {
                        "name": "Track";
                    },
                    {
                        "name": "Playlist";
                    }
                ];
            };
        }
    ];
    "errors": [
        {
            "code": 6000;
            "name": "Unauthorized";
            "msg": "You are not authorized to perform this action.";
        },
        {
            "code": 6001;
            "name": "RevokedAuthority";
            "msg": "This authority's delegation status is revoked.";
        },
        {
            "code": 6002;
            "name": "ProgramDerivedAddressNotFound";
            "msg": "The expected program derived address was not found.";
        },
        {
            "code": 6003;
            "name": "InvalidUserAuthorityDelegation";
            "msg": "This authority has not been delegated access to the user.";
        },
        {
            "code": 6004;
            "name": "MissingDelegateAccount";
            "msg": "The given authority does not belong to the user so delegate accounts must be provided.";
        },
        {
            "code": 6005;
            "name": "SignatureVerification";
            "msg": "Signature verification failed.";
        },
        {
            "code": 6006;
            "name": "InvalidId";
            "msg": "Invalid Id.";
        }
    ];
};

/**
 * Library of typescript functions used in tests/CLI
 * Intended for later integration with libs
 */

/**
 * Audius Admin
 */
declare type InitAdminParams = {
    payer: anchor.web3.PublicKey;
    program: Program<AudiusData>;
    adminKeypair: Keypair;
    adminStorageKeypair: Keypair;
    verifierKeypair: Keypair;
};
declare const initAdmin: ({ payer, program, adminKeypair, adminStorageKeypair, verifierKeypair, }: InitAdminParams) => anchor.web3.Transaction;
declare type Proposer = {
    pda: anchor.web3.PublicKey;
    authorityPublicKey: anchor.web3.PublicKey;
    seedBump: {
        seed: Buffer;
        bump: number;
    };
};
declare type InitUserParams = {
    payer: anchor.web3.PublicKey;
    program: Program<AudiusData>;
    ethAddress: string;
    userId: anchor.BN;
    bumpSeed: number;
    metadata: string;
    userStorageAccount: anchor.web3.PublicKey;
    baseAuthorityAccount: anchor.web3.PublicKey;
    adminStorageAccount: anchor.web3.PublicKey;
    adminAuthorityPublicKey: anchor.web3.PublicKey;
    replicaSet: number[];
    replicaSetBumps: number[];
    cn1: anchor.web3.PublicKey;
    cn2: anchor.web3.PublicKey;
    cn3: anchor.web3.PublicKey;
};
declare const initUser: ({ payer, program, ethAddress, userId, bumpSeed, replicaSet, replicaSetBumps, metadata, userStorageAccount, baseAuthorityAccount, adminStorageAccount, adminAuthorityPublicKey, cn1, cn2, cn3, }: InitUserParams) => anchor.web3.Transaction;
declare type InitUserSolPubkeyParams = {
    program: Program<AudiusData>;
    ethPrivateKey: string;
    message: Uint8Array;
    userSolPubkey: anchor.web3.PublicKey;
    userStorageAccount: anchor.web3.PublicKey;
};
declare const initUserSolPubkey: ({ program, ethPrivateKey, message, userSolPubkey, userStorageAccount, }: InitUserSolPubkeyParams) => anchor.web3.Transaction;
declare type CreateContentNodeParams = {
    payer: anchor.web3.PublicKey;
    program: Program<AudiusData>;
    adminPublicKey: anchor.web3.PublicKey;
    adminStoragePublicKey: anchor.web3.PublicKey;
    baseAuthorityAccount: anchor.web3.PublicKey;
    contentNodeAcct: anchor.web3.PublicKey;
    contentNodeAuthority: anchor.web3.PublicKey;
    spID: anchor.BN;
    ownerEthAddress: string;
};
declare const createContentNode: ({ payer, program, adminStoragePublicKey, adminPublicKey, baseAuthorityAccount, spID, contentNodeAuthority, contentNodeAcct, ownerEthAddress, }: CreateContentNodeParams) => anchor.web3.Transaction;
declare type UpdateUserReplicaSetParams = {
    payer: anchor.web3.PublicKey;
    program: Program<AudiusData>;
    adminStoragePublicKey: anchor.web3.PublicKey;
    baseAuthorityAccount: anchor.web3.PublicKey;
    replicaSet: number[];
    replicaSetBumps: number[];
    contentNodeAuthorityPublicKey: anchor.web3.PublicKey;
    cn1: anchor.web3.PublicKey;
    cn2: anchor.web3.PublicKey;
    cn3: anchor.web3.PublicKey;
    userAcct: anchor.web3.PublicKey;
    userIdSeedBump: {
        userId: number;
        bump: number;
    };
};
declare const updateUserReplicaSet: ({ payer, program, adminStoragePublicKey, baseAuthorityAccount, replicaSet, userAcct, replicaSetBumps, userIdSeedBump, contentNodeAuthorityPublicKey, cn1, cn2, cn3, }: UpdateUserReplicaSetParams) => anchor.web3.Transaction;
declare type PublicCreateOrUpdateContentNodeParams = {
    payer: anchor.web3.PublicKey;
    program: Program<AudiusData>;
    adminStoragePublicKey: anchor.web3.PublicKey;
    baseAuthorityAccount: anchor.web3.PublicKey;
    contentNodeAcct: anchor.web3.PublicKey;
    contentNodeAuthority: anchor.web3.PublicKey;
    spID: anchor.BN;
    ownerEthAddress: string;
    proposer1: Proposer;
    proposer2: Proposer;
    proposer3: Proposer;
};
declare const publicCreateOrUpdateContentNode: ({ payer, program, adminStoragePublicKey, baseAuthorityAccount, spID, contentNodeAcct, ownerEthAddress, contentNodeAuthority, proposer1, proposer2, proposer3, }: PublicCreateOrUpdateContentNodeParams) => anchor.web3.Transaction;
declare type PublicDeleteContentNodeParams = {
    payer: anchor.web3.PublicKey;
    program: Program<AudiusData>;
    adminStoragePublicKey: anchor.web3.PublicKey;
    adminAuthorityPublicKey: anchor.web3.PublicKey;
    baseAuthorityAccount: anchor.web3.PublicKey;
    cnDelete: Proposer;
    proposer1: Proposer;
    proposer2: Proposer;
    proposer3: Proposer;
};
declare const publicDeleteContentNode: ({ payer, program, adminStoragePublicKey, adminAuthorityPublicKey, baseAuthorityAccount, cnDelete, proposer1, proposer2, proposer3, }: PublicDeleteContentNodeParams) => anchor.web3.Transaction;
declare type CreateUserParams = {
    payer: anchor.web3.PublicKey;
    program: Program<AudiusData>;
    ethAccount: Account;
    message: Uint8Array;
    userId: anchor.BN;
    bumpSeed: number;
    metadata: string;
    userSolPubkey: anchor.web3.PublicKey;
    userStorageAccount: anchor.web3.PublicKey;
    adminStoragePublicKey: anchor.web3.PublicKey;
    baseAuthorityAccount: anchor.web3.PublicKey;
    replicaSet: number[];
    replicaSetBumps: number[];
    cn1: anchor.web3.PublicKey;
    cn2: anchor.web3.PublicKey;
    cn3: anchor.web3.PublicKey;
};
declare const createUser: ({ baseAuthorityAccount, program, ethAccount, message, replicaSet, replicaSetBumps, cn1, cn2, cn3, userId, bumpSeed, metadata, payer, userSolPubkey, userStorageAccount, adminStoragePublicKey, }: CreateUserParams) => anchor.web3.Transaction;
declare type UpdateUserParams = {
    program: Program<AudiusData>;
    metadata: string;
    userStorageAccount: anchor.web3.PublicKey;
    userAuthorityDelegate: anchor.web3.PublicKey;
    authorityDelegationStatusAccount: anchor.web3.PublicKey;
    userAuthorityPublicKey: anchor.web3.PublicKey;
};
declare const updateUser: ({ program, metadata, userStorageAccount, userAuthorityPublicKey, userAuthorityDelegate, authorityDelegationStatusAccount, }: UpdateUserParams) => anchor.web3.Transaction;
declare type UpdateAdminParams = {
    program: Program<AudiusData>;
    isWriteEnabled: boolean;
    adminStorageAccount: anchor.web3.PublicKey;
    adminAuthorityKeypair: anchor.web3.Keypair;
};
declare const updateAdmin: ({ program, isWriteEnabled, adminStorageAccount, adminAuthorityKeypair, }: UpdateAdminParams) => anchor.web3.Transaction;
/**
 * User delegation
 */
declare type InitAuthorityDelegationStatusParams = {
    program: Program<AudiusData>;
    authorityName: string;
    userAuthorityDelegatePublicKey: anchor.web3.PublicKey;
    authorityDelegationStatusPDA: anchor.web3.PublicKey;
    payer: anchor.web3.PublicKey;
};
declare const initAuthorityDelegationStatus: ({ program, authorityName, userAuthorityDelegatePublicKey, authorityDelegationStatusPDA, payer, }: InitAuthorityDelegationStatusParams) => anchor.web3.Transaction;
declare type RevokeAuthorityDelegationParams = {
    program: Program<AudiusData>;
    authorityDelegationBump: number;
    userAuthorityDelegatePublicKey: anchor.web3.PublicKey;
    authorityDelegationStatusPDA: anchor.web3.PublicKey;
    payer: anchor.web3.PublicKey;
};
declare const revokeAuthorityDelegation: ({ program, authorityDelegationBump, userAuthorityDelegatePublicKey, authorityDelegationStatusPDA, payer, }: RevokeAuthorityDelegationParams) => anchor.web3.Transaction;
declare type AddUserAuthorityDelegateParams = {
    program: Program<AudiusData>;
    baseAuthorityAccount: anchor.web3.PublicKey;
    delegatePublicKey: anchor.web3.PublicKey;
    user: anchor.web3.PublicKey;
    currentUserAuthorityDelegate: anchor.web3.PublicKey;
    adminStoragePublicKey: anchor.web3.PublicKey;
    userId: anchor.BN;
    userBumpSeed: number;
    signerUserAuthorityDelegate: anchor.web3.PublicKey;
    authorityDelegationStatus: anchor.web3.PublicKey;
    authorityPublicKey: anchor.web3.PublicKey;
    payer: anchor.web3.PublicKey;
};
declare const addUserAuthorityDelegate: ({ program, baseAuthorityAccount, delegatePublicKey, user, authorityDelegationStatus, currentUserAuthorityDelegate, userId, userBumpSeed, adminStoragePublicKey, signerUserAuthorityDelegate, authorityPublicKey, payer, }: AddUserAuthorityDelegateParams) => anchor.web3.Transaction;
declare type RemoveUserAuthorityDelegateParams = {
    program: Program<AudiusData>;
    baseAuthorityAccount: anchor.web3.PublicKey;
    delegatePublicKey: anchor.web3.PublicKey;
    delegateBump: number;
    user: anchor.web3.PublicKey;
    currentUserAuthorityDelegate: anchor.web3.PublicKey;
    adminStoragePublicKey: anchor.web3.PublicKey;
    userId: anchor.BN;
    userBumpSeed: number;
    signerUserAuthorityDelegate: anchor.web3.PublicKey;
    authorityDelegationStatus: anchor.web3.PublicKey;
    authorityPublicKey: anchor.web3.PublicKey;
    payer: anchor.web3.PublicKey;
};
declare const removeUserAuthorityDelegate: ({ program, baseAuthorityAccount, delegatePublicKey, delegateBump, user, authorityDelegationStatus, currentUserAuthorityDelegate, userId, userBumpSeed, adminStoragePublicKey, signerUserAuthorityDelegate, authorityPublicKey, payer, }: RemoveUserAuthorityDelegateParams) => anchor.web3.Transaction;
declare type UpdateIsVerifiedParams = {
    program: Program<AudiusData>;
    userStorageAccount: anchor.web3.PublicKey;
    verifierPublicKey: anchor.web3.PublicKey;
    baseAuthorityAccount: anchor.web3.PublicKey;
    adminPublicKey: anchor.web3.PublicKey;
    userId: anchor.BN;
    bumpSeed: number;
};
declare const updateIsVerified: ({ program, adminPublicKey, userStorageAccount, verifierPublicKey, baseAuthorityAccount, userId, bumpSeed, }: UpdateIsVerifiedParams) => anchor.web3.Transaction;
declare type CreateEntityParams = {
    program: Program<AudiusData>;
    baseAuthorityAccount: anchor.web3.PublicKey;
    adminStorageAccount: anchor.web3.PublicKey;
    userId: anchor.BN;
    bumpSeed: number;
    userAuthorityPublicKey: anchor.web3.PublicKey;
    userStorageAccountPDA: anchor.web3.PublicKey;
    userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
    authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
    metadata: string;
    id: anchor.BN;
};
declare type DeleteEntityParams = {
    program: Program<AudiusData>;
    id: anchor.BN;
    userAuthorityPublicKey: anchor.web3.PublicKey;
    userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
    authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
    userStorageAccountPDA: anchor.web3.PublicKey;
    baseAuthorityAccount: anchor.web3.PublicKey;
    adminStorageAccount: anchor.web3.PublicKey;
    userId: anchor.BN;
    bumpSeed: number;
};
declare const createTrack: ({ id, program, baseAuthorityAccount, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userStorageAccountPDA, metadata, userId, adminStorageAccount, bumpSeed, }: CreateEntityParams) => anchor.web3.Transaction;
/**
 * Manage entity
 * actions: create, update, delete
 * entities: track, playlist
 */
declare const EntityTypesEnumValues: {
    track: {
        track: {};
    };
    playlist: {
        playlist: {};
    };
};
declare const ManagementActions: {
    create: {
        create: {};
    };
    update: {
        update: {};
    };
    delete: {
        delete: {};
    };
};
declare type UpdateEntityParams = {
    program: Program<AudiusData>;
    baseAuthorityAccount: anchor.web3.PublicKey;
    adminStorageAccount: anchor.web3.PublicKey;
    userId: anchor.BN;
    bumpSeed: number;
    metadata: string;
    id: anchor.BN;
    userAuthorityPublicKey: anchor.web3.PublicKey;
    userStorageAccountPDA: anchor.web3.PublicKey;
    userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
    authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
};
declare const updateTrack: ({ program, baseAuthorityAccount, id, metadata, userAuthorityPublicKey, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userId, adminStorageAccount, bumpSeed, }: UpdateEntityParams) => anchor.web3.Transaction;
declare const deleteTrack: ({ program, id, userStorageAccountPDA, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, baseAuthorityAccount, userId, adminStorageAccount, bumpSeed, }: DeleteEntityParams) => anchor.web3.Transaction;
declare const createPlaylist: ({ id, program, baseAuthorityAccount, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userStorageAccountPDA, metadata, userId, adminStorageAccount, bumpSeed, }: CreateEntityParams) => anchor.web3.Transaction;
declare const updatePlaylist: ({ id, program, baseAuthorityAccount, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userStorageAccountPDA, metadata, userId, adminStorageAccount, bumpSeed, }: UpdateEntityParams) => anchor.web3.Transaction;
declare const deletePlaylist: ({ program, id, userStorageAccountPDA, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, baseAuthorityAccount, userId, adminStorageAccount, bumpSeed, }: DeleteEntityParams) => anchor.web3.Transaction;
/**
 * Write entity social actions
 * actions: save, repost
 * entities: track, playlist
 */
declare const EntitySocialActionEnumValues: {
    addSave: {
        addSave: {};
    };
    deleteSave: {
        deleteSave: {};
    };
    addRepost: {
        addRepost: {};
    };
    deleteRepost: {
        deleteRepost: {};
    };
};
declare const EntitySocialActions: {
    addSave: {
        addSave: {};
    };
    deleteSave: {
        deleteSave: {};
    };
    addRepost: {
        addRepost: {};
    };
    deleteRepost: {
        deleteRepost: {};
    };
};
declare type EntitySocialActionParams = {
    program: Program<AudiusData>;
    baseAuthorityAccount: anchor.web3.PublicKey;
    userStorageAccountPDA: anchor.web3.PublicKey;
    userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
    authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
    userAuthorityPublicKey: anchor.web3.PublicKey;
    adminStoragePublicKey: anchor.web3.PublicKey;
    userId: anchor.BN;
    bumpSeed: number;
    id: string;
};
declare const addTrackSave: ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, }: EntitySocialActionParams) => anchor.web3.Transaction;
declare const deleteTrackSave: ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, }: EntitySocialActionParams) => anchor.web3.Transaction;
declare const addTrackRepost: ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, }: EntitySocialActionParams) => anchor.web3.Transaction;
declare const deleteTrackRepost: ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, }: EntitySocialActionParams) => anchor.web3.Transaction;
declare const addPlaylistSave: ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, }: EntitySocialActionParams) => anchor.web3.Transaction;
declare const deletePlaylistSave: ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, }: EntitySocialActionParams) => anchor.web3.Transaction;
declare const addPlaylistRepost: ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, }: EntitySocialActionParams) => anchor.web3.Transaction;
declare const deletePlaylistRepost: ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, }: EntitySocialActionParams) => anchor.web3.Transaction;
/**
 * User social actions
 */
declare const UserSocialActions: {
    followUser: {
        followUser: {};
    };
    unfollowUser: {
        unfollowUser: {};
    };
    subscribeUser: {
        subscribeUser: {};
    };
    unsubscribeUser: {
        unsubscribeUser: {};
    };
};
declare type UserSocialActionParams = {
    program: Program<AudiusData>;
    baseAuthorityAccount: anchor.web3.PublicKey;
    sourceUserStorageAccountPDA: anchor.web3.PublicKey;
    targetUserStorageAccountPDA: anchor.web3.PublicKey;
    userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
    authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
    userAuthorityPublicKey: anchor.web3.PublicKey;
    adminStoragePublicKey: anchor.web3.PublicKey;
    sourceUserId: anchor.BN;
    sourceUserBumpSeed: number;
    targetUserId: anchor.BN;
    targetUserBumpSeed: number;
};
declare const followUser: ({ program, baseAuthorityAccount, sourceUserStorageAccountPDA, targetUserStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, sourceUserId, sourceUserBumpSeed, targetUserId, targetUserBumpSeed, adminStoragePublicKey, }: UserSocialActionParams) => anchor.web3.Transaction;
declare const unfollowUser: ({ program, baseAuthorityAccount, sourceUserStorageAccountPDA, targetUserStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, sourceUserId, sourceUserBumpSeed, targetUserId, targetUserBumpSeed, adminStoragePublicKey, }: UserSocialActionParams) => anchor.web3.Transaction;
declare const subscribeUser: ({ program, baseAuthorityAccount, sourceUserStorageAccountPDA, targetUserStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, sourceUserId, sourceUserBumpSeed, targetUserId, targetUserBumpSeed, adminStoragePublicKey, }: UserSocialActionParams) => anchor.web3.Transaction;
declare const unsubscribeUser: ({ program, baseAuthorityAccount, sourceUserStorageAccountPDA, targetUserStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, sourceUserId, sourceUserBumpSeed, targetUserId, targetUserBumpSeed, adminStoragePublicKey, }: UserSocialActionParams) => anchor.web3.Transaction;
/**
 * Helper functions
 */
declare const getKeypairFromSecretKey: (secretKey: Uint8Array) => Promise<anchor.web3.Keypair>;
declare const idl: {
    version: string;
    name: string;
    instructions: {
        name: string;
        accounts: {
            name: string;
            isMut: boolean;
            isSigner: boolean;
        }[];
        args: ({
            name: string;
            type: string;
        } | {
            name: string;
            type: {
                defined: string;
                array?: undefined;
            };
        } | {
            name: string;
            type: {
                array: (string | number)[];
                defined?: undefined;
            };
        })[];
        returns: any;
    }[];
    accounts: {
        name: string;
        type: {
            kind: string;
            fields: ({
                name: string;
                type: {
                    array: (string | number)[];
                };
            } | {
                name: string;
                type: string;
            })[];
        };
    }[];
    types: ({
        name: string;
        type: {
            kind: string;
            fields: ({
                name: string;
                type: {
                    array: (string | number)[];
                };
            } | {
                name: string;
                type: string;
            })[];
            variants?: undefined;
        };
    } | {
        name: string;
        type: {
            kind: string;
            variants: {
                name: string;
            }[];
            fields?: undefined;
        };
    })[];
    errors: {
        code: number;
        name: string;
        msg: string;
    }[];
};

export { AddUserAuthorityDelegateParams, CreateContentNodeParams, CreateEntityParams, CreateUserParams, DeleteEntityParams, EntitySocialActionEnumValues, EntitySocialActionParams, EntitySocialActions, EntityTypesEnumValues, InitAdminParams, InitAuthorityDelegationStatusParams, InitUserParams, InitUserSolPubkeyParams, ManagementActions, Proposer, PublicCreateOrUpdateContentNodeParams, PublicDeleteContentNodeParams, RemoveUserAuthorityDelegateParams, RevokeAuthorityDelegationParams, UpdateAdminParams, UpdateEntityParams, UpdateIsVerifiedParams, UpdateUserParams, UpdateUserReplicaSetParams, UserSocialActionParams, UserSocialActions, addPlaylistRepost, addPlaylistSave, addTrackRepost, addTrackSave, addUserAuthorityDelegate, createContentNode, createPlaylist, createTrack, createUser, deletePlaylist, deletePlaylistRepost, deletePlaylistSave, deleteTrack, deleteTrackRepost, deleteTrackSave, followUser, getKeypairFromSecretKey, idl, initAdmin, initAuthorityDelegationStatus, initUser, initUserSolPubkey, publicCreateOrUpdateContentNode, publicDeleteContentNode, removeUserAuthorityDelegate, revokeAuthorityDelegation, subscribeUser, unfollowUser, unsubscribeUser, updateAdmin, updateIsVerified, updatePlaylist, updateTrack, updateUser, updateUserReplicaSet };
