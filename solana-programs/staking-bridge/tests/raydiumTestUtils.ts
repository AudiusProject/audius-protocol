import * as anchor from "@coral-xyz/anchor";
import { Market as MarketSerum } from '@project-serum/serum'
import { Liquidity, LiquidityAssociatedPoolKeys, Market as raydiumSerum, SPL_MINT_LAYOUT } from "@raydium-io/raydium-sdk"

const { PublicKey } = anchor.web3

class Market extends MarketSerum {
  public baseVault = null
  public quoteVault = null
  public requestQueue = null
  public eventQueue = null
  public bids = null
  public asks = null
  public baseLotSize: number = 0
  public quoteLotSize: number = 0
  public quoteMint = null
  public baseMint = null
  public vaultSignerNonce: Number | null = null

  static async load(connection, address, options: any = {}, programId) {
    const { owner, data } = throwIfNull(await connection.getAccountInfo(address), 'Market not found')
    if (!owner.equals(programId)) {
      throw new Error('Address not owned by program: ' + owner.toBase58())
    }
    const decoded = this.getLayout(programId).decode(data)
    if (!decoded.accountFlags.initialized || !decoded.accountFlags.market || !decoded.ownAddress.equals(address)) {
      throw new Error('Invalid market')
    }
    const [baseMintDecimals, quoteMintDecimals] = await Promise.all([
      getMintDecimals(connection, decoded.baseMint),
      getMintDecimals(connection, decoded.quoteMint)
    ])

    const market = new Market(decoded, baseMintDecimals, quoteMintDecimals, options, programId)
    market.baseLotSize = decoded.baseLotSize
    market.quoteLotSize = decoded.quoteLotSize
    market.baseVault = decoded.baseVault
    market.quoteVault = decoded.quoteVault
    market.requestQueue = decoded.requestQueue
    market.eventQueue = decoded.eventQueue
    market.bids = decoded.bids
    market.asks = decoded.asks
    market.quoteMint = decoded.quoteMint
    market.baseMint = decoded.baseMint
    market.vaultSignerNonce = decoded.vaultSignerNonce
    return market
  }
}

async function getMintDecimals(connection, mint): Promise<number> {
  const { data } = throwIfNull(await connection.getAccountInfo(mint), 'mint not found')
  const { decimals } = SPL_MINT_LAYOUT.decode(data)
  return decimals
}

function throwIfNull<T>(value: T | null, message = 'account not found'): T {
  if (value === null) {
    throw new Error(message)
  }
  return value
}

export const getMarket = async (conn: any, marketAddress: string, serumProgramId: string): Promise<Market> => {
  try {
    const marketAddressPubKey = new PublicKey(marketAddress)
    const market = await Market.load(conn, marketAddressPubKey, undefined, new PublicKey(serumProgramId))
    return market
  } catch (error: any) {
    console.log("get market err: ", error)
    throw error;
  }
}

export const getAssociatedPoolKeys = async ({
  programId,
  serumProgramId,
  marketId,
  baseMint,
  quoteMint,
}: any): Promise<LiquidityAssociatedPoolKeys> => {
  const id = Liquidity.getAssociatedId({ programId, marketId });
  const lpMint = Liquidity.getAssociatedLpMint({ programId, marketId });
  const { publicKey: authority, nonce } = Liquidity.getAssociatedAuthority({ programId });
  const baseVault = Liquidity.getAssociatedBaseVault({ programId, marketId });
  const quoteVault = Liquidity.getAssociatedQuoteVault({ programId, marketId });
  const lpVault = Liquidity.getAssociatedLpVault({ programId, marketId });
  const openOrders = Liquidity.getAssociatedOpenOrders({ programId, marketId });
  const targetOrders = Liquidity.getAssociatedTargetOrders({ programId, marketId });
  const withdrawQueue = Liquidity.getAssociatedWithdrawQueue({ programId, marketId });

  const { publicKey: marketAuthority } = raydiumSerum.getAssociatedAuthority({
    programId: serumProgramId,
    marketId,
  });

  return {
    // base
    id,
    baseMint,
    quoteMint,
    lpMint,
    // version
    version: 4,
    programId,
    // keys
    authority,
    nonce,
    baseVault,
    quoteVault,
    lpVault,
    openOrders,
    targetOrders,
    withdrawQueue,
    // market version
    marketVersion: 4,
    marketProgramId: serumProgramId,
    // market keys
    marketId,
    marketAuthority,
  };
}

export async function getVaultOwnerAndNonce(marketId, dexProgramId) {
  const vaultNonce = new anchor.BN(0);
  while (true) {
    try {
      const vaultOwner = await PublicKey.createProgramAddress(
        [marketId.toBuffer(), vaultNonce.toArrayLike(Buffer, 'le', 8)],
        dexProgramId,
      );
      return { vaultOwner, vaultNonce };
    } catch (e) {
      vaultNonce.iaddn(1);
    }
  }
}
