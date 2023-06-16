import { z } from 'zod';

export const Aggregate_monthly_total_users_metricsScalarFieldEnumSchema =
  z.enum(['id', 'count', 'timestamp', 'created_at', 'updated_at']);
