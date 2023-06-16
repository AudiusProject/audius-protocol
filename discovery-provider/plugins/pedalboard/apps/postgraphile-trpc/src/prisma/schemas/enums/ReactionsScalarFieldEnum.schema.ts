import { z } from 'zod';

export const ReactionsScalarFieldEnumSchema = z.enum([
  'id',
  'slot',
  'reaction_value',
  'sender_wallet',
  'reaction_type',
  'reacted_to',
  'timestamp',
  'tx_signature',
]);
