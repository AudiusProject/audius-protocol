import { z } from 'zod';

export const skippedtransactionlevelSchema = z.enum(['node', 'network']);
