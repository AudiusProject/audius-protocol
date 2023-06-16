import { t, publicProcedure } from "./helpers/createRouter";
import { reward_manager_txsAggregateSchema } from "../schemas/aggregatereward_manager_txs.schema";
import { reward_manager_txsCreateManySchema } from "../schemas/createManyreward_manager_txs.schema";
import { reward_manager_txsCreateOneSchema } from "../schemas/createOnereward_manager_txs.schema";
import { reward_manager_txsDeleteManySchema } from "../schemas/deleteManyreward_manager_txs.schema";
import { reward_manager_txsDeleteOneSchema } from "../schemas/deleteOnereward_manager_txs.schema";
import { reward_manager_txsFindFirstSchema } from "../schemas/findFirstreward_manager_txs.schema";
import { reward_manager_txsFindManySchema } from "../schemas/findManyreward_manager_txs.schema";
import { reward_manager_txsFindUniqueSchema } from "../schemas/findUniquereward_manager_txs.schema";
import { reward_manager_txsGroupBySchema } from "../schemas/groupByreward_manager_txs.schema";
import { reward_manager_txsUpdateManySchema } from "../schemas/updateManyreward_manager_txs.schema";
import { reward_manager_txsUpdateOneSchema } from "../schemas/updateOnereward_manager_txs.schema";
import { reward_manager_txsUpsertSchema } from "../schemas/upsertOnereward_manager_txs.schema";

export const reward_manager_txsRouter = t.router({
  aggregatereward_manager_txs: publicProcedure
    .input(reward_manager_txsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatereward_manager_txs = await ctx.prisma.reward_manager_txs.aggregate(input);
      return aggregatereward_manager_txs;
    }),
  createManyreward_manager_txs: publicProcedure
    .input(reward_manager_txsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyreward_manager_txs = await ctx.prisma.reward_manager_txs.createMany(input);
      return createManyreward_manager_txs;
    }),
  createOnereward_manager_txs: publicProcedure
    .input(reward_manager_txsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnereward_manager_txs = await ctx.prisma.reward_manager_txs.create(input);
      return createOnereward_manager_txs;
    }),
  deleteManyreward_manager_txs: publicProcedure
    .input(reward_manager_txsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyreward_manager_txs = await ctx.prisma.reward_manager_txs.deleteMany(input);
      return deleteManyreward_manager_txs;
    }),
  deleteOnereward_manager_txs: publicProcedure
    .input(reward_manager_txsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnereward_manager_txs = await ctx.prisma.reward_manager_txs.delete(input);
      return deleteOnereward_manager_txs;
    }),
  findFirstreward_manager_txs: publicProcedure
    .input(reward_manager_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstreward_manager_txs = await ctx.prisma.reward_manager_txs.findFirst(input);
      return findFirstreward_manager_txs;
    }),
  findFirstreward_manager_txsOrThrow: publicProcedure
    .input(reward_manager_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstreward_manager_txsOrThrow = await ctx.prisma.reward_manager_txs.findFirstOrThrow(input);
      return findFirstreward_manager_txsOrThrow;
    }),
  findManyreward_manager_txs: publicProcedure
    .input(reward_manager_txsFindManySchema).query(async ({ ctx, input }) => {
      const findManyreward_manager_txs = await ctx.prisma.reward_manager_txs.findMany(input);
      return findManyreward_manager_txs;
    }),
  findUniquereward_manager_txs: publicProcedure
    .input(reward_manager_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquereward_manager_txs = await ctx.prisma.reward_manager_txs.findUnique(input);
      return findUniquereward_manager_txs;
    }),
  findUniquereward_manager_txsOrThrow: publicProcedure
    .input(reward_manager_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquereward_manager_txsOrThrow = await ctx.prisma.reward_manager_txs.findUniqueOrThrow(input);
      return findUniquereward_manager_txsOrThrow;
    }),
  groupByreward_manager_txs: publicProcedure
    .input(reward_manager_txsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByreward_manager_txs = await ctx.prisma.reward_manager_txs.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByreward_manager_txs;
    }),
  updateManyreward_manager_txs: publicProcedure
    .input(reward_manager_txsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyreward_manager_txs = await ctx.prisma.reward_manager_txs.updateMany(input);
      return updateManyreward_manager_txs;
    }),
  updateOnereward_manager_txs: publicProcedure
    .input(reward_manager_txsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnereward_manager_txs = await ctx.prisma.reward_manager_txs.update(input);
      return updateOnereward_manager_txs;
    }),
  upsertOnereward_manager_txs: publicProcedure
    .input(reward_manager_txsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnereward_manager_txs = await ctx.prisma.reward_manager_txs.upsert(input);
      return upsertOnereward_manager_txs;
    }),

}) 
