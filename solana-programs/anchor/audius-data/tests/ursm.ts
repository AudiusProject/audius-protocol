import { expect } from "chai";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { sendAndConfirmRawTransaction } from "@solana/web3.js";

import {
  initAdmin,
  createContentNode,
  publicCreateContentNode,
} from "../lib/lib";
import { findDerivedPair } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  confirmLogInTransaction,
  createSolanaContentNode,
  EthWeb3,
} from "./test-helpers";
const { SystemProgram } = anchor.web3;

describe.only("ursm", function () {
  const provider = anchor.Provider.local("http://localhost:8899", {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;

  const adminKeypair = anchor.web3.Keypair.generate();
  const adminStgKeypair = anchor.web3.Keypair.generate();
  const verifierKeypair = anchor.web3.Keypair.generate();

  it("Initializing admin account!", async function () {
    await initAdmin({
      provider,
      program,
      adminKeypair,
      adminStgKeypair,
      verifierKeypair,
      playlistIdOffset: new anchor.BN("0"),
    });
    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStgKeypair.publicKey
    );

    const chainAuthority = adminAccount.authority.toString();
    const expectedAuthority = adminKeypair.publicKey.toString();
  });

  it("Creates Content Node with the Admin account", async function () {
    const ownerEth = EthWeb3.eth.accounts.create();
    const spID = new anchor.BN(1);
    const authority = anchor.web3.Keypair.generate();
    const { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.concat([Buffer.from("sp_id", "utf8"), spID.toBuffer("le", 2)])
      );

    const tx = await createContentNode({
      provider,
      program,
      adminKeypair,
      baseAuthorityAccount,
      adminStgPublicKey: adminStgKeypair.publicKey,
      contentNodeAuthority: authority.publicKey,
      contentNodeAcct: derivedAddress,
      spID,
      ownerEthAddress: ownerEth.address,
    });

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
    const cn1 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(2),
    });
    const cn2 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(3),
    });
    const cn3 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(4),
    });

    const spID = new anchor.BN(5);
    const ownerEth = EthWeb3.eth.accounts.create();

    const { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.concat([Buffer.from("sp_id", "utf8"), spID.toBuffer("le", 2)])
      );
    const authority = anchor.web3.Keypair.generate();
    const tx = await publicCreateContentNode({
      provider,
      program,
      baseAuthorityAccount,
      adminStgPublicKey: adminStgKeypair.publicKey,
      contentNodeAcct: derivedAddress,
      spID,
      contentNodeAuthority: authority.publicKey,
      ownerEthAddress: ownerEth.address,
      proposer1: {
        pda: cn1.pda,
        authority: cn1.authority,
        seedBump: cn1.seedBump,
      },
      proposer2: {
        pda: cn2.pda,
        authority: cn2.authority,
        seedBump: cn2.seedBump,
      },
      proposer3: {
        pda: cn3.pda,
        authority: cn3.authority,
        seedBump: cn3.seedBump,
      },
    });

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
      adminStgKeypair,
      spId: new anchor.BN(6),
    });
    const cn7 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(7),
    });
    const cn8 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(8),
    });

    const spID = new anchor.BN(9);
    const ownerEth = EthWeb3.eth.accounts.create();

    const { baseAuthorityAccount, derivedAddress } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.concat([Buffer.from("sp_id", "utf8"), spID.toBuffer("le", 2)])
    );
    const authority = anchor.web3.Keypair.generate();
    const createTransaction = (recentBlockhash) => {
      const tx = new anchor.web3.Transaction({ recentBlockhash });
      const txInstr = program.instruction.publicCreateContentNode(
        baseAuthorityAccount,
        { seed: [...cn6.seedBump.seed], bump: cn6.seedBump.bump },
        { seed: [...cn7.seedBump.seed], bump: cn7.seedBump.bump },
        { seed: [...cn8.seedBump.seed], bump: cn8.seedBump.bump },
        spID.toNumber(),
        authority.publicKey,
        [...anchor.utils.bytes.hex.decode(ownerEth.address)],
        {
          accounts: {
            admin: adminStgKeypair.publicKey,
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
      await provider.connection.getRecentBlockhash("confirmed")
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

    // NOTE: this must be raw transaction or else the send metho will nodify the transaction's recent blockhash and
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


  it("Deletes a Content Node with the proposers", async function () {
    const cn1 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(2),
    });
    const cn2 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(3),
    });
    const cn3 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(4),
    });

    const spID = new anchor.BN(5);
    const ownerEth = EthWeb3.eth.accounts.create();

    const { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.concat([Buffer.from("sp_id", "utf8"), spID.toBuffer("le", 2)])
      );
    const authority = anchor.web3.Keypair.generate();
    const tx = await publicCreateContentNode({
      provider,
      program,
      baseAuthorityAccount,
      adminStgPublicKey: adminStgKeypair.publicKey,
      contentNodeAcct: derivedAddress,
      spID,
      contentNodeAuthority: authority.publicKey,
      ownerEthAddress: ownerEth.address,
      proposer1: {
        pda: cn1.pda,
        authority: cn1.authority,
        seedBump: cn1.seedBump,
      },
      proposer2: {
        pda: cn2.pda,
        authority: cn2.authority,
        seedBump: cn2.seedBump,
      },
      proposer3: {
        pda: cn3.pda,
        authority: cn3.authority,
        seedBump: cn3.seedBump,
      },
    });

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
});
