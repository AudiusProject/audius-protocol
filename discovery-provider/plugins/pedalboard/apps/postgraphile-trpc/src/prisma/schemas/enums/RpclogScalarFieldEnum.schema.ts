import { z } from 'zod';

export const RpclogScalarFieldEnumSchema = z.enum([
  'cuid',
  'wallet',
  'method',
  'params',
  'jetstream_seq',
]);
