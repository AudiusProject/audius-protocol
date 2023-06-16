import { z } from 'zod';

export const Audio_transactions_historyScalarFieldEnumSchema = z.enum([
  'user_bank',
  'slot',
  'signature',
  'transaction_type',
  'method',
  'created_at',
  'updated_at',
  'transaction_created_at',
  'change',
  'balance',
  'tx_metadata',
]);
