import { z } from 'zod';

export const NullableJsonNullValueInputSchema = z.enum(['DbNull', 'JsonNull']);
