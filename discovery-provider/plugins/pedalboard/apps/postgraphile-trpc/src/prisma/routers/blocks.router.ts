import { t, publicProcedure } from "./helpers/createRouter";
import { blocksAggregateSchema } from "../schemas/aggregateblocks.schema";
import { blocksCreateManySchema } from "../schemas/createManyblocks.schema";
import { blocksCreateOneSchema } from "../schemas/createOneblocks.schema";
import { blocksDeleteManySchema } from "../schemas/deleteManyblocks.schema";
import { blocksDeleteOneSchema } from "../schemas/deleteOneblocks.schema";
import { blocksFindFirstSchema } from "../schemas/findFirstblocks.schema";
import { blocksFindManySchema } from "../schemas/findManyblocks.schema";
import { blocksFindUniqueSchema } from "../schemas/findUniqueblocks.schema";
import { blocksGroupBySchema } from "../schemas/groupByblocks.schema";
import { blocksUpdateManySchema } from "../schemas/updateManyblocks.schema";
import { blocksUpdateOneSchema } from "../schemas/updateOneblocks.schema";
import { blocksUpsertSchema } from "../schemas/upsertOneblocks.schema";

export const blocksRouter = t.router({
  aggregateblocks: publicProcedure
    .input(blocksAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateblocks = await ctx.prisma.blocks.aggregate(input);
      return aggregateblocks;
    }),
  createManyblocks: publicProcedure
    .input(blocksCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyblocks = await ctx.prisma.blocks.createMany(input);
      return createManyblocks;
    }),
  createOneblocks: publicProcedure
    .input(blocksCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneblocks = await ctx.prisma.blocks.create(input);
      return createOneblocks;
    }),
  deleteManyblocks: publicProcedure
    .input(blocksDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyblocks = await ctx.prisma.blocks.deleteMany(input);
      return deleteManyblocks;
    }),
  deleteOneblocks: publicProcedure
    .input(blocksDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneblocks = await ctx.prisma.blocks.delete(input);
      return deleteOneblocks;
    }),
  findFirstblocks: publicProcedure
    .input(blocksFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstblocks = await ctx.prisma.blocks.findFirst(input);
      return findFirstblocks;
    }),
  findFirstblocksOrThrow: publicProcedure
    .input(blocksFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstblocksOrThrow = await ctx.prisma.blocks.findFirstOrThrow(input);
      return findFirstblocksOrThrow;
    }),
  findManyblocks: publicProcedure
    .input(blocksFindManySchema).query(async ({ ctx, input }) => {
      const findManyblocks = await ctx.prisma.blocks.findMany(input);
      return findManyblocks;
    }),
  findUniqueblocks: publicProcedure
    .input(blocksFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueblocks = await ctx.prisma.blocks.findUnique(input);
      return findUniqueblocks;
    }),
  findUniqueblocksOrThrow: publicProcedure
    .input(blocksFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueblocksOrThrow = await ctx.prisma.blocks.findUniqueOrThrow(input);
      return findUniqueblocksOrThrow;
    }),
  groupByblocks: publicProcedure
    .input(blocksGroupBySchema).query(async ({ ctx, input }) => {
      const groupByblocks = await ctx.prisma.blocks.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByblocks;
    }),
  updateManyblocks: publicProcedure
    .input(blocksUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyblocks = await ctx.prisma.blocks.updateMany(input);
      return updateManyblocks;
    }),
  updateOneblocks: publicProcedure
    .input(blocksUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneblocks = await ctx.prisma.blocks.update(input);
      return updateOneblocks;
    }),
  upsertOneblocks: publicProcedure
    .input(blocksUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneblocks = await ctx.prisma.blocks.upsert(input);
      return upsertOneblocks;
    }),

}) 
