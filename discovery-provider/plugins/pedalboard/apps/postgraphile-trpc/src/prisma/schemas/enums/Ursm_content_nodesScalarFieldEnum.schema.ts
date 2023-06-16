import { z } from 'zod';

export const Ursm_content_nodesScalarFieldEnumSchema = z.enum([
  'blockhash',
  'blocknumber',
  'created_at',
  'is_current',
  'cnode_sp_id',
  'delegate_owner_wallet',
  'owner_wallet',
  'proposer_sp_ids',
  'proposer_1_delegate_owner_wallet',
  'proposer_2_delegate_owner_wallet',
  'proposer_3_delegate_owner_wallet',
  'endpoint',
  'txhash',
  'slot',
]);
