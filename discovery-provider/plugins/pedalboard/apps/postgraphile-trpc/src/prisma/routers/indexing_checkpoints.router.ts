import { t, publicProcedure } from "./helpers/createRouter";
import { indexing_checkpointsAggregateSchema } from "../schemas/aggregateindexing_checkpoints.schema";
import { indexing_checkpointsCreateManySchema } from "../schemas/createManyindexing_checkpoints.schema";
import { indexing_checkpointsCreateOneSchema } from "../schemas/createOneindexing_checkpoints.schema";
import { indexing_checkpointsDeleteManySchema } from "../schemas/deleteManyindexing_checkpoints.schema";
import { indexing_checkpointsDeleteOneSchema } from "../schemas/deleteOneindexing_checkpoints.schema";
import { indexing_checkpointsFindFirstSchema } from "../schemas/findFirstindexing_checkpoints.schema";
import { indexing_checkpointsFindManySchema } from "../schemas/findManyindexing_checkpoints.schema";
import { indexing_checkpointsFindUniqueSchema } from "../schemas/findUniqueindexing_checkpoints.schema";
import { indexing_checkpointsGroupBySchema } from "../schemas/groupByindexing_checkpoints.schema";
import { indexing_checkpointsUpdateManySchema } from "../schemas/updateManyindexing_checkpoints.schema";
import { indexing_checkpointsUpdateOneSchema } from "../schemas/updateOneindexing_checkpoints.schema";
import { indexing_checkpointsUpsertSchema } from "../schemas/upsertOneindexing_checkpoints.schema";

export const indexing_checkpointsRouter = t.router({
  aggregateindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateindexing_checkpoints = await ctx.prisma.indexing_checkpoints.aggregate(input);
      return aggregateindexing_checkpoints;
    }),
  createManyindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyindexing_checkpoints = await ctx.prisma.indexing_checkpoints.createMany(input);
      return createManyindexing_checkpoints;
    }),
  createOneindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneindexing_checkpoints = await ctx.prisma.indexing_checkpoints.create(input);
      return createOneindexing_checkpoints;
    }),
  deleteManyindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyindexing_checkpoints = await ctx.prisma.indexing_checkpoints.deleteMany(input);
      return deleteManyindexing_checkpoints;
    }),
  deleteOneindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneindexing_checkpoints = await ctx.prisma.indexing_checkpoints.delete(input);
      return deleteOneindexing_checkpoints;
    }),
  findFirstindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstindexing_checkpoints = await ctx.prisma.indexing_checkpoints.findFirst(input);
      return findFirstindexing_checkpoints;
    }),
  findFirstindexing_checkpointsOrThrow: publicProcedure
    .input(indexing_checkpointsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstindexing_checkpointsOrThrow = await ctx.prisma.indexing_checkpoints.findFirstOrThrow(input);
      return findFirstindexing_checkpointsOrThrow;
    }),
  findManyindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsFindManySchema).query(async ({ ctx, input }) => {
      const findManyindexing_checkpoints = await ctx.prisma.indexing_checkpoints.findMany(input);
      return findManyindexing_checkpoints;
    }),
  findUniqueindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueindexing_checkpoints = await ctx.prisma.indexing_checkpoints.findUnique(input);
      return findUniqueindexing_checkpoints;
    }),
  findUniqueindexing_checkpointsOrThrow: publicProcedure
    .input(indexing_checkpointsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueindexing_checkpointsOrThrow = await ctx.prisma.indexing_checkpoints.findUniqueOrThrow(input);
      return findUniqueindexing_checkpointsOrThrow;
    }),
  groupByindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByindexing_checkpoints = await ctx.prisma.indexing_checkpoints.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByindexing_checkpoints;
    }),
  updateManyindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyindexing_checkpoints = await ctx.prisma.indexing_checkpoints.updateMany(input);
      return updateManyindexing_checkpoints;
    }),
  updateOneindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneindexing_checkpoints = await ctx.prisma.indexing_checkpoints.update(input);
      return updateOneindexing_checkpoints;
    }),
  upsertOneindexing_checkpoints: publicProcedure
    .input(indexing_checkpointsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneindexing_checkpoints = await ctx.prisma.indexing_checkpoints.upsert(input);
      return upsertOneindexing_checkpoints;
    }),

}) 
