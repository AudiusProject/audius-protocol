import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_routesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => track_routesWhereInputObjectSchema),
        z.lazy(() => track_routesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => track_routesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => track_routesWhereInputObjectSchema),
        z.lazy(() => track_routesWhereInputObjectSchema).array(),
      ])
      .optional(),
    slug: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    title_slug: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    collision_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    owner_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    track_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    is_current: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    blockhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    blocknumber: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    txhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const track_routesWhereInputObjectSchema = Schema;
