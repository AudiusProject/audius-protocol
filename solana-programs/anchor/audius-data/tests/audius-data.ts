import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AudiusData } from '../target/types/audius_data';
import BN from 'bn.js';
const { SystemProgram, PublicKey } = anchor.web3;

describe('audius-data', () => {
  const provider = anchor.Provider.local()

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;

  let adminKeypair = anchor.web3.Keypair.generate()
  let adminStgKeypair = anchor.web3.Keypair.generate()
  let userKeypair = anchor.web3.Keypair.generate()

  console.log(`adminKeypair = ${adminKeypair.publicKey.toString()}`)
  console.log(`adminStgKeypair ${adminStgKeypair.publicKey.toString()}`)
  console.log(`userKeypair ${userKeypair.publicKey.toString()}`)

  it('Initializing admin account!', async () => {
    // Add your test here.
    const tx = await program.rpc.initializeAdmin(
      adminKeypair.publicKey,
      {
        accounts: {
          admin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [adminStgKeypair]
      }
    )

    console.log("Your transaction signature", tx);
    let adminAccount = await program.account.audiusAdmin.fetch(adminStgKeypair.publicKey)
    console.log("On chain retrieved admin info: ", adminAccount.authority.toString());
    console.log("Provided admin info: ", adminKeypair.publicKey.toString());
  });

  it('Initializing user!', async () => {
    let testEthAddr = '0x6A60013EB5ed20B2F0673D46ADE0b2Dcd00d2CDE'
    let testEthAddrBytes = ethAddressToArray(testEthAddr)
    // NOTE - Handle is currently limited to be 16 characters EXACTLY
    let handle = "goncaz1234567890"
    let handleBytes = Buffer.from(anchor.utils.bytes.utf8.encode(handle))
    let handleBytesArray = Array.from({...handleBytes, length: 16})

    const [user_account_pda, user_account_bump] = await PublicKey.findProgramAddress(
      [handleBytes],
      program.programId
    );
    let tx = await program.rpc.initUser(
      Array.from(testEthAddrBytes),
      handleBytesArray,
      user_account_bump,
      {
        accounts: {
          admin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          user: user_account_pda,
          authority: adminKeypair.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [adminKeypair]
      }
    )

    let userDataFromChain = await program.account.user.fetch(user_account_pda)
    let returnedHex = `0x${toHexString(userDataFromChain.ethAddress)}`
    console.log(`Eth address from chain ${returnedHex} | Original eth ${testEthAddr}`)

    if (testEthAddr.toLowerCase() == returnedHex) {
      console.log(`Retrieved address!`)
    }
  });
});

function toHexString(byteArray) {
  return byteArray.reduce((output, elem) =>
    (output + ('0' + elem.toString(16)).slice(-2)),
    '');
}


function ethAddressToArray(ethAddress: any) {
  const strippedEthAddress = ethAddress.replace('0x', '')
  return Uint8Array.of(...new BN(strippedEthAddress, 'hex').toArray('be'))
}

