import { t, publicProcedure } from "./helpers/createRouter";
import { eth_blocksAggregateSchema } from "../schemas/aggregateeth_blocks.schema";
import { eth_blocksCreateManySchema } from "../schemas/createManyeth_blocks.schema";
import { eth_blocksCreateOneSchema } from "../schemas/createOneeth_blocks.schema";
import { eth_blocksDeleteManySchema } from "../schemas/deleteManyeth_blocks.schema";
import { eth_blocksDeleteOneSchema } from "../schemas/deleteOneeth_blocks.schema";
import { eth_blocksFindFirstSchema } from "../schemas/findFirsteth_blocks.schema";
import { eth_blocksFindManySchema } from "../schemas/findManyeth_blocks.schema";
import { eth_blocksFindUniqueSchema } from "../schemas/findUniqueeth_blocks.schema";
import { eth_blocksGroupBySchema } from "../schemas/groupByeth_blocks.schema";
import { eth_blocksUpdateManySchema } from "../schemas/updateManyeth_blocks.schema";
import { eth_blocksUpdateOneSchema } from "../schemas/updateOneeth_blocks.schema";
import { eth_blocksUpsertSchema } from "../schemas/upsertOneeth_blocks.schema";

export const eth_blocksRouter = t.router({
  aggregateeth_blocks: publicProcedure
    .input(eth_blocksAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateeth_blocks = await ctx.prisma.eth_blocks.aggregate(input);
      return aggregateeth_blocks;
    }),
  createManyeth_blocks: publicProcedure
    .input(eth_blocksCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyeth_blocks = await ctx.prisma.eth_blocks.createMany(input);
      return createManyeth_blocks;
    }),
  createOneeth_blocks: publicProcedure
    .input(eth_blocksCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneeth_blocks = await ctx.prisma.eth_blocks.create(input);
      return createOneeth_blocks;
    }),
  deleteManyeth_blocks: publicProcedure
    .input(eth_blocksDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyeth_blocks = await ctx.prisma.eth_blocks.deleteMany(input);
      return deleteManyeth_blocks;
    }),
  deleteOneeth_blocks: publicProcedure
    .input(eth_blocksDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneeth_blocks = await ctx.prisma.eth_blocks.delete(input);
      return deleteOneeth_blocks;
    }),
  findFirsteth_blocks: publicProcedure
    .input(eth_blocksFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsteth_blocks = await ctx.prisma.eth_blocks.findFirst(input);
      return findFirsteth_blocks;
    }),
  findFirsteth_blocksOrThrow: publicProcedure
    .input(eth_blocksFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsteth_blocksOrThrow = await ctx.prisma.eth_blocks.findFirstOrThrow(input);
      return findFirsteth_blocksOrThrow;
    }),
  findManyeth_blocks: publicProcedure
    .input(eth_blocksFindManySchema).query(async ({ ctx, input }) => {
      const findManyeth_blocks = await ctx.prisma.eth_blocks.findMany(input);
      return findManyeth_blocks;
    }),
  findUniqueeth_blocks: publicProcedure
    .input(eth_blocksFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueeth_blocks = await ctx.prisma.eth_blocks.findUnique(input);
      return findUniqueeth_blocks;
    }),
  findUniqueeth_blocksOrThrow: publicProcedure
    .input(eth_blocksFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueeth_blocksOrThrow = await ctx.prisma.eth_blocks.findUniqueOrThrow(input);
      return findUniqueeth_blocksOrThrow;
    }),
  groupByeth_blocks: publicProcedure
    .input(eth_blocksGroupBySchema).query(async ({ ctx, input }) => {
      const groupByeth_blocks = await ctx.prisma.eth_blocks.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByeth_blocks;
    }),
  updateManyeth_blocks: publicProcedure
    .input(eth_blocksUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyeth_blocks = await ctx.prisma.eth_blocks.updateMany(input);
      return updateManyeth_blocks;
    }),
  updateOneeth_blocks: publicProcedure
    .input(eth_blocksUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneeth_blocks = await ctx.prisma.eth_blocks.update(input);
      return updateOneeth_blocks;
    }),
  upsertOneeth_blocks: publicProcedure
    .input(eth_blocksUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneeth_blocks = await ctx.prisma.eth_blocks.upsert(input);
      return upsertOneeth_blocks;
    }),

}) 
