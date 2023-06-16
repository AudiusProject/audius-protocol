import { z } from 'zod';

export const NotificationScalarFieldEnumSchema = z.enum([
  'id',
  'specifier',
  'group_id',
  'type',
  'slot',
  'blocknumber',
  'timestamp',
  'data',
  'user_ids',
  'type_v2',
]);
