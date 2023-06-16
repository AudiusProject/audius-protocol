import { z } from 'zod';

export const User_balancesScalarFieldEnumSchema = z.enum([
  'user_id',
  'balance',
  'created_at',
  'updated_at',
  'associated_wallets_balance',
  'waudio',
  'associated_sol_wallets_balance',
]);
