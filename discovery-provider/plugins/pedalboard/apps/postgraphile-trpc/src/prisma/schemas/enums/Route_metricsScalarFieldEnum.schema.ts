import { z } from 'zod';

export const Route_metricsScalarFieldEnumSchema = z.enum([
  'route_path',
  'version',
  'query_string',
  'count',
  'timestamp',
  'created_at',
  'updated_at',
  'id',
  'ip',
]);
