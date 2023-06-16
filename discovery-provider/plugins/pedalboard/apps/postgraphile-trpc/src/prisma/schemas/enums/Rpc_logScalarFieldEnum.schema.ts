import { z } from 'zod';

export const Rpc_logScalarFieldEnumSchema = z.enum([
  'relayed_at',
  'from_wallet',
  'rpc',
  'sig',
  'relayed_by',
  'applied_at',
]);
