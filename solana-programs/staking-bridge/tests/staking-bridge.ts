import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { StakingBridge } from '../target/types/staking_bridge';

const {
  PublicKey,
  SystemProgram,
} = anchor.web3

describe('staking-bridge', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.StakingBridge as Program<StakingBridge>;

  it('creates the staking bridge pda', async () => {
    const [stakingBridgePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('staking_bridge')],
      program.programId
    );
    // Add your test here.
    const tx = await program.methods
      .createPda()
      .accounts({
        stakingBridgePda,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log('Your transaction signature', tx);
  });
});
