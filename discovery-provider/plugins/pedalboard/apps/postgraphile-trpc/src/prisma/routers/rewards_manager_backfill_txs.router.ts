import { t, publicProcedure } from "./helpers/createRouter";
import { rewards_manager_backfill_txsAggregateSchema } from "../schemas/aggregaterewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsCreateManySchema } from "../schemas/createManyrewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsCreateOneSchema } from "../schemas/createOnerewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsDeleteManySchema } from "../schemas/deleteManyrewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsDeleteOneSchema } from "../schemas/deleteOnerewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsFindFirstSchema } from "../schemas/findFirstrewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsFindManySchema } from "../schemas/findManyrewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsFindUniqueSchema } from "../schemas/findUniquerewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsGroupBySchema } from "../schemas/groupByrewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsUpdateManySchema } from "../schemas/updateManyrewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsUpdateOneSchema } from "../schemas/updateOnerewards_manager_backfill_txs.schema";
import { rewards_manager_backfill_txsUpsertSchema } from "../schemas/upsertOnerewards_manager_backfill_txs.schema";

export const rewards_manager_backfill_txsRouter = t.router({
  aggregaterewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregaterewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.aggregate(input);
      return aggregaterewards_manager_backfill_txs;
    }),
  createManyrewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyrewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.createMany(input);
      return createManyrewards_manager_backfill_txs;
    }),
  createOnerewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnerewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.create(input);
      return createOnerewards_manager_backfill_txs;
    }),
  deleteManyrewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyrewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.deleteMany(input);
      return deleteManyrewards_manager_backfill_txs;
    }),
  deleteOnerewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnerewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.delete(input);
      return deleteOnerewards_manager_backfill_txs;
    }),
  findFirstrewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.findFirst(input);
      return findFirstrewards_manager_backfill_txs;
    }),
  findFirstrewards_manager_backfill_txsOrThrow: publicProcedure
    .input(rewards_manager_backfill_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrewards_manager_backfill_txsOrThrow = await ctx.prisma.rewards_manager_backfill_txs.findFirstOrThrow(input);
      return findFirstrewards_manager_backfill_txsOrThrow;
    }),
  findManyrewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsFindManySchema).query(async ({ ctx, input }) => {
      const findManyrewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.findMany(input);
      return findManyrewards_manager_backfill_txs;
    }),
  findUniquerewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.findUnique(input);
      return findUniquerewards_manager_backfill_txs;
    }),
  findUniquerewards_manager_backfill_txsOrThrow: publicProcedure
    .input(rewards_manager_backfill_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerewards_manager_backfill_txsOrThrow = await ctx.prisma.rewards_manager_backfill_txs.findUniqueOrThrow(input);
      return findUniquerewards_manager_backfill_txsOrThrow;
    }),
  groupByrewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByrewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByrewards_manager_backfill_txs;
    }),
  updateManyrewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyrewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.updateMany(input);
      return updateManyrewards_manager_backfill_txs;
    }),
  updateOnerewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnerewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.update(input);
      return updateOnerewards_manager_backfill_txs;
    }),
  upsertOnerewards_manager_backfill_txs: publicProcedure
    .input(rewards_manager_backfill_txsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnerewards_manager_backfill_txs = await ctx.prisma.rewards_manager_backfill_txs.upsert(input);
      return upsertOnerewards_manager_backfill_txs;
    }),

}) 
