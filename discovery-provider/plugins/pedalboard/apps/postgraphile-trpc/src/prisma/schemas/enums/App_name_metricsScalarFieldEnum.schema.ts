import { z } from 'zod';

export const App_name_metricsScalarFieldEnumSchema = z.enum([
  'application_name',
  'count',
  'timestamp',
  'created_at',
  'updated_at',
  'id',
  'ip',
]);
