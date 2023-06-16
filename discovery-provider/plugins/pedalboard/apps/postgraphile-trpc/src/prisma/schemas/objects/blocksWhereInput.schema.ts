import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { BoolNullableFilterObjectSchema } from './BoolNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { Developer_appsListRelationFilterObjectSchema } from './Developer_appsListRelationFilter.schema';
import { GrantsListRelationFilterObjectSchema } from './GrantsListRelationFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => blocksWhereInputObjectSchema),
        z.lazy(() => blocksWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => blocksWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => blocksWhereInputObjectSchema),
        z.lazy(() => blocksWhereInputObjectSchema).array(),
      ])
      .optional(),
    blockhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    parenthash: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    is_current: z
      .union([z.lazy(() => BoolNullableFilterObjectSchema), z.boolean()])
      .optional()
      .nullable(),
    number: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    developer_apps_developer_apps_blockhashToblocks: z
      .lazy(() => Developer_appsListRelationFilterObjectSchema)
      .optional(),
    developer_apps_developer_apps_blocknumberToblocks: z
      .lazy(() => Developer_appsListRelationFilterObjectSchema)
      .optional(),
    grants_grants_blockhashToblocks: z
      .lazy(() => GrantsListRelationFilterObjectSchema)
      .optional(),
    grants_grants_blocknumberToblocks: z
      .lazy(() => GrantsListRelationFilterObjectSchema)
      .optional(),
  })
  .strict();

export const blocksWhereInputObjectSchema = Schema;
