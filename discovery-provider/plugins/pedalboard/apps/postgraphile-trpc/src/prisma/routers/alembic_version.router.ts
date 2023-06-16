import { t, publicProcedure } from "./helpers/createRouter";
import { alembic_versionAggregateSchema } from "../schemas/aggregatealembic_version.schema";
import { alembic_versionCreateManySchema } from "../schemas/createManyalembic_version.schema";
import { alembic_versionCreateOneSchema } from "../schemas/createOnealembic_version.schema";
import { alembic_versionDeleteManySchema } from "../schemas/deleteManyalembic_version.schema";
import { alembic_versionDeleteOneSchema } from "../schemas/deleteOnealembic_version.schema";
import { alembic_versionFindFirstSchema } from "../schemas/findFirstalembic_version.schema";
import { alembic_versionFindManySchema } from "../schemas/findManyalembic_version.schema";
import { alembic_versionFindUniqueSchema } from "../schemas/findUniquealembic_version.schema";
import { alembic_versionGroupBySchema } from "../schemas/groupByalembic_version.schema";
import { alembic_versionUpdateManySchema } from "../schemas/updateManyalembic_version.schema";
import { alembic_versionUpdateOneSchema } from "../schemas/updateOnealembic_version.schema";
import { alembic_versionUpsertSchema } from "../schemas/upsertOnealembic_version.schema";

export const alembic_versionsRouter = t.router({
  aggregatealembic_version: publicProcedure
    .input(alembic_versionAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatealembic_version = await ctx.prisma.alembic_version.aggregate(input);
      return aggregatealembic_version;
    }),
  createManyalembic_version: publicProcedure
    .input(alembic_versionCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyalembic_version = await ctx.prisma.alembic_version.createMany(input);
      return createManyalembic_version;
    }),
  createOnealembic_version: publicProcedure
    .input(alembic_versionCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnealembic_version = await ctx.prisma.alembic_version.create(input);
      return createOnealembic_version;
    }),
  deleteManyalembic_version: publicProcedure
    .input(alembic_versionDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyalembic_version = await ctx.prisma.alembic_version.deleteMany(input);
      return deleteManyalembic_version;
    }),
  deleteOnealembic_version: publicProcedure
    .input(alembic_versionDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnealembic_version = await ctx.prisma.alembic_version.delete(input);
      return deleteOnealembic_version;
    }),
  findFirstalembic_version: publicProcedure
    .input(alembic_versionFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstalembic_version = await ctx.prisma.alembic_version.findFirst(input);
      return findFirstalembic_version;
    }),
  findFirstalembic_versionOrThrow: publicProcedure
    .input(alembic_versionFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstalembic_versionOrThrow = await ctx.prisma.alembic_version.findFirstOrThrow(input);
      return findFirstalembic_versionOrThrow;
    }),
  findManyalembic_version: publicProcedure
    .input(alembic_versionFindManySchema).query(async ({ ctx, input }) => {
      const findManyalembic_version = await ctx.prisma.alembic_version.findMany(input);
      return findManyalembic_version;
    }),
  findUniquealembic_version: publicProcedure
    .input(alembic_versionFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquealembic_version = await ctx.prisma.alembic_version.findUnique(input);
      return findUniquealembic_version;
    }),
  findUniquealembic_versionOrThrow: publicProcedure
    .input(alembic_versionFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquealembic_versionOrThrow = await ctx.prisma.alembic_version.findUniqueOrThrow(input);
      return findUniquealembic_versionOrThrow;
    }),
  groupByalembic_version: publicProcedure
    .input(alembic_versionGroupBySchema).query(async ({ ctx, input }) => {
      const groupByalembic_version = await ctx.prisma.alembic_version.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByalembic_version;
    }),
  updateManyalembic_version: publicProcedure
    .input(alembic_versionUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyalembic_version = await ctx.prisma.alembic_version.updateMany(input);
      return updateManyalembic_version;
    }),
  updateOnealembic_version: publicProcedure
    .input(alembic_versionUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnealembic_version = await ctx.prisma.alembic_version.update(input);
      return updateOnealembic_version;
    }),
  upsertOnealembic_version: publicProcedure
    .input(alembic_versionUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnealembic_version = await ctx.prisma.alembic_version.upsert(input);
      return upsertOnealembic_version;
    }),

}) 
