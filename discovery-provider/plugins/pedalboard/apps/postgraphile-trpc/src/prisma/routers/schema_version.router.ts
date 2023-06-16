import { t, publicProcedure } from "./helpers/createRouter";
import { schema_versionAggregateSchema } from "../schemas/aggregateschema_version.schema";
import { schema_versionCreateManySchema } from "../schemas/createManyschema_version.schema";
import { schema_versionCreateOneSchema } from "../schemas/createOneschema_version.schema";
import { schema_versionDeleteManySchema } from "../schemas/deleteManyschema_version.schema";
import { schema_versionDeleteOneSchema } from "../schemas/deleteOneschema_version.schema";
import { schema_versionFindFirstSchema } from "../schemas/findFirstschema_version.schema";
import { schema_versionFindManySchema } from "../schemas/findManyschema_version.schema";
import { schema_versionFindUniqueSchema } from "../schemas/findUniqueschema_version.schema";
import { schema_versionGroupBySchema } from "../schemas/groupByschema_version.schema";
import { schema_versionUpdateManySchema } from "../schemas/updateManyschema_version.schema";
import { schema_versionUpdateOneSchema } from "../schemas/updateOneschema_version.schema";
import { schema_versionUpsertSchema } from "../schemas/upsertOneschema_version.schema";

export const schema_versionsRouter = t.router({
  aggregateschema_version: publicProcedure
    .input(schema_versionAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateschema_version = await ctx.prisma.schema_version.aggregate(input);
      return aggregateschema_version;
    }),
  createManyschema_version: publicProcedure
    .input(schema_versionCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyschema_version = await ctx.prisma.schema_version.createMany(input);
      return createManyschema_version;
    }),
  createOneschema_version: publicProcedure
    .input(schema_versionCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneschema_version = await ctx.prisma.schema_version.create(input);
      return createOneschema_version;
    }),
  deleteManyschema_version: publicProcedure
    .input(schema_versionDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyschema_version = await ctx.prisma.schema_version.deleteMany(input);
      return deleteManyschema_version;
    }),
  deleteOneschema_version: publicProcedure
    .input(schema_versionDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneschema_version = await ctx.prisma.schema_version.delete(input);
      return deleteOneschema_version;
    }),
  findFirstschema_version: publicProcedure
    .input(schema_versionFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstschema_version = await ctx.prisma.schema_version.findFirst(input);
      return findFirstschema_version;
    }),
  findFirstschema_versionOrThrow: publicProcedure
    .input(schema_versionFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstschema_versionOrThrow = await ctx.prisma.schema_version.findFirstOrThrow(input);
      return findFirstschema_versionOrThrow;
    }),
  findManyschema_version: publicProcedure
    .input(schema_versionFindManySchema).query(async ({ ctx, input }) => {
      const findManyschema_version = await ctx.prisma.schema_version.findMany(input);
      return findManyschema_version;
    }),
  findUniqueschema_version: publicProcedure
    .input(schema_versionFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueschema_version = await ctx.prisma.schema_version.findUnique(input);
      return findUniqueschema_version;
    }),
  findUniqueschema_versionOrThrow: publicProcedure
    .input(schema_versionFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueschema_versionOrThrow = await ctx.prisma.schema_version.findUniqueOrThrow(input);
      return findUniqueschema_versionOrThrow;
    }),
  groupByschema_version: publicProcedure
    .input(schema_versionGroupBySchema).query(async ({ ctx, input }) => {
      const groupByschema_version = await ctx.prisma.schema_version.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByschema_version;
    }),
  updateManyschema_version: publicProcedure
    .input(schema_versionUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyschema_version = await ctx.prisma.schema_version.updateMany(input);
      return updateManyschema_version;
    }),
  updateOneschema_version: publicProcedure
    .input(schema_versionUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneschema_version = await ctx.prisma.schema_version.update(input);
      return updateOneschema_version;
    }),
  upsertOneschema_version: publicProcedure
    .input(schema_versionUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneschema_version = await ctx.prisma.schema_version.upsert(input);
      return upsertOneschema_version;
    }),

}) 
