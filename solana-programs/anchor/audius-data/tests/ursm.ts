import { expect } from "chai";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { sendAndConfirmRawTransaction } from "@solana/web3.js";
import {
    initAdmin,
    createContentNode,
    publicCreateOrUpdateContentNode,
    publicDeleteContentNode,
    updateUserReplicaSet,
    updateAdmin,
} from "../lib/lib";
import { findDerivedPair, convertBNToSpIdSeed } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
    createSolanaContentNode,
    createSolanaUser,
    EthWeb3,
} from "./test-helpers";
const { SystemProgram } = anchor.web3;

describe("replicaSet", function () {
    const provider = anchor.Provider.local("http://localhost:8899", {
        preflightCommitment: "confirmed",
        commitment: "confirmed",
    });

    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());

    const program = anchor.workspace.AudiusData as Program<AudiusData>;

    const adminKeypair = anchor.web3.Keypair.generate();
    const adminStorageKeypair = anchor.web3.Keypair.generate();
    const verifierKeypair = anchor.web3.Keypair.generate();
    const contentNodes = {};

    it("Initializing admin account!", async function () {
        let tx = initAdmin({
            payer: provider.wallet.publicKey,
            program,
            adminKeypair,
            adminStorageKeypair,
            verifierKeypair,
        });

        await provider.send(tx, [adminStorageKeypair])
        // disable admin writes
        const updateAdminTx = updateAdmin({
            program,
            isWriteEnabled: false,
            adminStorageAccount: adminStorageKeypair.publicKey,
            adminAuthorityKeypair: adminKeypair,
        });

        await provider.send(updateAdminTx, [adminKeypair])
    });

    it("Creates Content Node with the Admin account", async function () {
        const ownerEth = EthWeb3.eth.accounts.create();
        const spID = new anchor.BN(1);
        const authority = anchor.web3.Keypair.generate();
        const { baseAuthorityAccount, derivedAddress } = await findDerivedPair(
            program.programId,
            adminStorageKeypair.publicKey,
            convertBNToSpIdSeed(spID)
        );

        const tx = createContentNode({
            payer: provider.wallet.publicKey,
            program,
            adminPublicKey: adminKeypair.publicKey,
            baseAuthorityAccount,
            adminStoragePublicKey: adminStorageKeypair.publicKey,
            contentNodeAuthority: authority.publicKey,
            contentNodeAcct
                : derivedAddress,
            spID,
            ownerEthAddress: ownerEth.address,
        });
        await provider.send(tx, [adminKeypair])

        const account = await program.account.contentNode.fetch(derivedAddress);

        expect(
            account.authority.toString(),
            "content node authority set correctly"
        ).to.equal(authority.publicKey.toString());
        expect(
            anchor.utils.bytes.hex.encode(Buffer.from(account.ownerEthAddress)),
            "content node owner eth addr set correctly"
        ).to.equal(ownerEth.address.toLowerCase());
    });

    it("Creates Content Node with the proposers", async function () {
        const cn2 = await createSolanaContentNode({
            program,
            provider,
            adminKeypair,
            adminStorageKeypair,
            spId: new anchor.BN(2),
        });
        const cn3 = await createSolanaContentNode({
            program,
            provider,
            adminKeypair,
            adminStorageKeypair,
            spId: new anchor.BN(3),
        });
        const cn4 = await createSolanaContentNode({
            program,
            provider,
            adminKeypair,
            adminStorageKeypair,
            spId: new anchor.BN(4),
        });
        contentNodes[cn2.spId.toString()] = cn2;
        contentNodes[cn3.spId.toString()] = cn3;
        contentNodes[cn4.spId.toString()] = cn4;

        const spID = new anchor.BN(5);
        const ownerEth = EthWeb3.eth.accounts.create();

        const { baseAuthorityAccount, derivedAddress } = await findDerivedPair(
            program.programId,
            adminStorageKeypair.publicKey,
            convertBNToSpIdSeed(spID)
        );
        const authority = anchor.web3.Keypair.generate();
        const tx = await publicCreateOrUpdateContentNode({
            payer: provider.wallet.publicKey,
            program,
            baseAuthorityAccount,
            adminStoragePublicKey: adminStorageKeypair.publicKey,
            contentNodeAcct: derivedAddress,
            spID,
            contentNodeAuthority: authority.publicKey,
            ownerEthAddress: ownerEth.address,
            proposer1: {
                pda: cn2.pda,
                authorityPublicKey: cn2.authority.publicKey,
                seedBump: cn2.seedBump,
            },
            proposer2: {
                pda: cn4.pda,
                authorityPublicKey: cn4.authority.publicKey,
                seedBump: cn4.seedBump,
            },
            proposer3: {
                pda: cn3.pda,
                authorityPublicKey: cn3.authority.publicKey,
                seedBump: cn3.seedBump,
            },
        });
        await provider.send(tx, [cn2.authority, cn4.authority, cn3.authority])

        const account = await program.account.contentNode.fetch(derivedAddress);

        expect(
            account.authority.toString(),
            "content node authority set correctly"
        ).to.equal(authority.publicKey.toString());
        expect(
            anchor.utils.bytes.hex.encode(Buffer.from(account.ownerEthAddress)),
            "content node owner eth addr set correctly"
        ).to.equal(ownerEth.address.toLowerCase());
    });

    it("Creates Content Node with multiple signed proposers", async function () {
        const cn6 = await createSolanaContentNode({
            program,
            provider,
            adminKeypair,
            adminStorageKeypair,
            spId: new anchor.BN(6),
        });
        const cn7 = await createSolanaContentNode({
            program,
            provider,
            adminKeypair,
            adminStorageKeypair,
            spId: new anchor.BN(7),
        });
        const cn8 = await createSolanaContentNode({
            program,
            provider,
            adminKeypair,
            adminStorageKeypair,
            spId: new anchor.BN(8),
        });
        contentNodes[cn6.spId.toString()] = cn6;
        contentNodes[cn7.spId.toString()] = cn7;
        contentNodes[cn8.spId.toString()] = cn8;

        const spID = new anchor.BN(9);
        const ownerEth = EthWeb3.eth.accounts.create();

        const { baseAuthorityAccount, derivedAddress } = await findDerivedPair(
            program.programId,
            adminStorageKeypair.publicKey,
            convertBNToSpIdSeed(spID)
        );
        const authority = anchor.web3.Keypair.generate();
        const createTransaction = (recentBlockhash) => {
            const tx = new anchor.web3.Transaction({ recentBlockhash });
            const txInstr = program.instruction.publicCreateOrUpdateContentNode(
                baseAuthorityAccount,
                { seed: [...cn6.seedBump.seed], bump: cn6.seedBump.bump },
                { seed: [...cn7.seedBump.seed], bump: cn7.seedBump.bump },
                { seed: [...cn8.seedBump.seed], bump: cn8.seedBump.bump },
                spID.toNumber(),
                authority.publicKey,
                [...anchor.utils.bytes.hex.decode(ownerEth.address)],
                {
                    accounts: {
                        admin: adminStorageKeypair.publicKey,
                        payer: provider.wallet.publicKey,
                        contentNode: derivedAddress,
                        systemProgram: SystemProgram.programId,
                        proposer1: cn6.pda,
                        proposer1Authority: cn6.authority.publicKey,
                        proposer2: cn7.pda,
                        proposer2Authority: cn7.authority.publicKey,
                        proposer3: cn8.pda,
                        proposer3Authority: cn8.authority.publicKey,
                    },
                }
            );
            tx.add(txInstr);
            return tx;
        };
        const feePayerWallet = provider.wallet;

        // Create tx on signer 1 and sign
        const blockhash = (
            await provider.connection.getLatestBlockhash("confirmed")
        ).blockhash;
        const tx1 = createTransaction(blockhash);
        tx1.feePayer = feePayerWallet.publicKey;
        tx1.partialSign(cn6.authority);
        const sig1 = tx1.signatures.find(
            (s) => s.publicKey.toBase58() === cn6.authority.publicKey.toBase58()
        );

        const tx2 = createTransaction(blockhash);
        tx2.feePayer = feePayerWallet.publicKey;
        tx2.partialSign(cn7.authority);
        const sig2 = tx2.signatures.find(
            (s) => s.publicKey.toBase58() === cn7.authority.publicKey.toBase58()
        );

        const tx3 = createTransaction(blockhash);
        tx3.feePayer = feePayerWallet.publicKey;
        tx3.partialSign(cn8.authority);
        const sig3 = tx3.signatures.find(
            (s) => s.publicKey.toBase58() === cn8.authority.publicKey.toBase58()
        );

        const tx = createTransaction(blockhash);
        tx.feePayer = feePayerWallet.publicKey;
        await feePayerWallet.signTransaction(tx);

        tx.addSignature(cn6.authority.publicKey, sig1.signature);
        tx.addSignature(cn7.authority.publicKey, sig2.signature);
        tx.addSignature(cn8.authority.publicKey, sig3.signature);

        // NOTE: this must be raw transaction or else the send method will nodify the transaction's recent blockhash and
        // invalidate the signatures
        await sendAndConfirmRawTransaction(provider.connection, tx.serialize(), {});

        const account = await program.account.contentNode.fetch(derivedAddress);

        expect(
            account.authority.toString(),
            "content node authority set correctly"
        ).to.equal(authority.publicKey.toString());
        expect(
            anchor.utils.bytes.hex.encode(Buffer.from(account.ownerEthAddress)),
            "content node owner eth addr set correctly"
        ).to.equal(ownerEth.address.toLowerCase());
    });

    it("Updates a Content Node with the proposers", async function () {
        const cn2 = contentNodes["2"];
        const cn3 = contentNodes["3"];
        const cn4 = contentNodes["4"];

        const cnToUpdate = contentNodes["6"];

        const spID = new anchor.BN(4);
        const seed = convertBNToSpIdSeed(spID)

        const { baseAuthorityAccount } = await findDerivedPair(
            program.programId,
            adminStorageKeypair.publicKey,
            seed
        );
        const updatedAuthority = anchor.web3.Keypair.generate();

        const tx = publicCreateOrUpdateContentNode({
            payer: provider.wallet.publicKey,
            program,
            baseAuthorityAccount,
            adminStoragePublicKey: adminStorageKeypair.publicKey,
            contentNodeAuthority: updatedAuthority.publicKey,
            contentNodeAcct: cnToUpdate.pda,
            spID: cnToUpdate.spId,
            ownerEthAddress: cnToUpdate.ownerEthAddress,
            proposer1: {
                pda: cn4.pda,
                authorityPublicKey: cn4.authority.publicKey,
                seedBump: cn4.seedBump,
            },
            proposer2: {
                pda: cn2.pda,
                authorityPublicKey: cn2.authority.publicKey,
                seedBump: cn2.seedBump,
            },
            proposer3: {
                pda: cn3.pda,
                authorityPublicKey: cn3.authority.publicKey,
                seedBump: cn3.seedBump,
            },
        });
        await provider.send(tx, [cn2.authority, cn4.authority, cn3.authority])

        const account = await program.account.contentNode.fetch(cnToUpdate.pda);
        expect(
            account.authority.toBase58(),
            "updated content node authority to be set"
        ).to.equal(updatedAuthority.publicKey.toBase58());
    });

    it("Deletes a Content Node with the proposers", async function () {
        const cn2 = contentNodes["2"];
        const cn3 = contentNodes["3"];
        const cn4 = contentNodes["4"];

        const cnToDelete = contentNodes["6"];

        const spID = new anchor.BN(4);
        const seed = convertBNToSpIdSeed(spID)
        const { baseAuthorityAccount, bumpSeed, derivedAddress } =
            await findDerivedPair(
                program.programId,
                adminStorageKeypair.publicKey,
                seed
            );

        const initAudiusAdminBalance = await provider.connection.getBalance(
            adminKeypair.publicKey
        );

        const tx = publicDeleteContentNode({
            payer: provider.wallet.publicKey,
            program,
            baseAuthorityAccount,
            adminAuthorityPublicKey: adminKeypair.publicKey,
            adminStoragePublicKey: adminStorageKeypair.publicKey,
            cnDelete: {
                pda: derivedAddress,
                authorityPublicKey: cnToDelete.authority.publicKey,
                seedBump: {
                    seed,
                    bump: bumpSeed,
                },
            },
            proposer1: {
                pda: cn4.pda,
                authorityPublicKey: cn4.authority.publicKey,
                seedBump: cn4.seedBump,
            },
            proposer2: {
                pda: cn2.pda,
                authorityPublicKey: cn2.authority.publicKey,
                seedBump: cn2.seedBump,
            },
            proposer3: {
                pda: cn3.pda,
                authorityPublicKey: cn3.authority.publicKey,
                seedBump: cn3.seedBump,
            },
        });
        await provider.send(tx, [cn2.authority, cn4.authority, cn3.authority])

        // Confirm that the account is zero'd out
        // Note that there appears to be a delay in the propagation, hence the retries
        let updatedAudiusAdminBalance = initAudiusAdminBalance;
        let retries = 20;
        while (
            updatedAudiusAdminBalance === initAudiusAdminBalance &&
            retries > 0
        ) {
            updatedAudiusAdminBalance = await provider.connection.getBalance(
                adminKeypair.publicKey
            );
            await new Promise((resolve) => setTimeout(resolve, 100));
            retries--;
        }

        if (initAudiusAdminBalance === updatedAudiusAdminBalance) {
            throw new Error("Failed to deallocate track");
        }

        try {
            await program.account.contentNode.fetch(derivedAddress);
            throw new Error("Should throw error on fetch deleted account");
        } catch (e) {
            expect(e.message, "content node account should not exist").to.contain(
                "Account does not exist"
            );
        }
    });

    it("Updates a user replica set with the proposers", async function () {
        const cn2 = contentNodes["2"];
        const cn3 = contentNodes["3"];
        const cn6 = contentNodes["6"];

        const spID = new anchor.BN(4);
        const seed = convertBNToSpIdSeed(spID)
        const { baseAuthorityAccount } = await findDerivedPair(
            program.programId,
            adminStorageKeypair.publicKey,
            seed
        );

        const user = await createSolanaUser(program, provider, adminStorageKeypair);
        const tx = updateUserReplicaSet({
            payer: provider.wallet.publicKey,
            program,
            baseAuthorityAccount,
            userAcct: user.pda,
            userIdSeedBump: { userId: user.userId, bump: user.bumpSeed },
            adminStoragePublicKey: adminStorageKeypair.publicKey,
            replicaSet: [2, 3, 6],
            replicaSetBumps: [
                cn2.seedBump.bump,
                cn3.seedBump.bump,
                cn6.seedBump.bump,
            ],
            contentNodeAuthorityPublicKey: cn2.authority.publicKey,
            cn1: cn2.pda,
            cn2: cn3.pda,
            cn3: cn6.pda,
        });

        await provider.send(tx, [cn2.authority])

        const updatedUser = await program.account.user.fetch(user.pda);
        expect(
            updatedUser.replicaSet,
            "Expect user replicaSet to be updates"
        ).to.deep.equal([2, 3, 6]);
    });

    it("Updates a user replica set with the user's athority", async function () {
        const cn6 = contentNodes["6"];
        const cn7 = contentNodes["7"];
        const cn8 = contentNodes["8"];

        const spID = new anchor.BN(4);
        const seed = convertBNToSpIdSeed(spID)
        const { baseAuthorityAccount } = await findDerivedPair(
            program.programId,
            adminStorageKeypair.publicKey,
            seed
        );

        const user = await createSolanaUser(program, provider, adminStorageKeypair);
        const tx = updateUserReplicaSet({
            payer: provider.wallet.publicKey,
            program,
            baseAuthorityAccount,
            userAcct: user.pda,
            userIdSeedBump: { userId: user.userId, bump: user.bumpSeed },
            adminStoragePublicKey: adminStorageKeypair.publicKey,
            replicaSet: [6, 7, 8],
            replicaSetBumps: [
                cn6.seedBump.bump,
                cn7.seedBump.bump,
                cn8.seedBump.bump,
            ],
            contentNodeAuthorityPublicKey: user.keypair.publicKey,
            cn1: cn6.pda,
            cn2: cn7.pda,
            cn3: cn8.pda,
        });
        await provider.send(tx, [user.keypair])
        const updatedUser = await program.account.user.fetch(user.pda);
        expect(
            updatedUser.replicaSet,
            "Expect user replicaSet to be updates"
        ).to.deep.equal([6, 7, 8]);
    });

    it("Fail on update to a user's replica set with a non authority", async function () {
        const cn2 = contentNodes["2"];
        const cn7 = contentNodes["7"];
        const cn8 = contentNodes["8"];

        const spID = new anchor.BN(4);
        const seed = convertBNToSpIdSeed(spID)
        const { baseAuthorityAccount } = await findDerivedPair(
            program.programId,
            adminStorageKeypair.publicKey,
            seed
        );

        const user = await createSolanaUser(program, provider, adminStorageKeypair);

        await expect(
            provider.send(updateUserReplicaSet({
                payer: provider.wallet.publicKey,
                program,
                baseAuthorityAccount,
                userAcct: user.pda,
                userIdSeedBump: { userId: user.userId, bump: user.bumpSeed },
                adminStoragePublicKey: adminStorageKeypair.publicKey,
                replicaSet: [2, 7, 8],
                replicaSetBumps: [
                    cn2.seedBump.bump,
                    cn7.seedBump.bump,
                    cn8.seedBump.bump,
                ],
                contentNodeAuthorityPublicKey: cn7.authority.publicKey,
                cn1: cn2.pda,
                cn2: cn7.pda,
                cn3: cn8.pda,
            }), [cn7.authority])
        )
            .to.eventually.be.rejected.and.property("logs")
            .to.include(`Program log: AnchorError occurred. Error Code: Unauthorized. Error Number: 6000. Error Message: You are not authorized to perform this action..`);
    });
});
