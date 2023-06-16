import { z } from 'zod';

export const User_bank_accountsScalarFieldEnumSchema = z.enum([
  'signature',
  'ethereum_address',
  'created_at',
  'bank_account',
]);
