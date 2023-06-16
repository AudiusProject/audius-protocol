import { t, publicProcedure } from "./helpers/createRouter";
import { user_bank_backfill_txsAggregateSchema } from "../schemas/aggregateuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsCreateManySchema } from "../schemas/createManyuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsCreateOneSchema } from "../schemas/createOneuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsDeleteManySchema } from "../schemas/deleteManyuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsDeleteOneSchema } from "../schemas/deleteOneuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsFindFirstSchema } from "../schemas/findFirstuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsFindManySchema } from "../schemas/findManyuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsFindUniqueSchema } from "../schemas/findUniqueuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsGroupBySchema } from "../schemas/groupByuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsUpdateManySchema } from "../schemas/updateManyuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsUpdateOneSchema } from "../schemas/updateOneuser_bank_backfill_txs.schema";
import { user_bank_backfill_txsUpsertSchema } from "../schemas/upsertOneuser_bank_backfill_txs.schema";

export const user_bank_backfill_txsRouter = t.router({
  aggregateuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.aggregate(input);
      return aggregateuser_bank_backfill_txs;
    }),
  createManyuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.createMany(input);
      return createManyuser_bank_backfill_txs;
    }),
  createOneuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.create(input);
      return createOneuser_bank_backfill_txs;
    }),
  deleteManyuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.deleteMany(input);
      return deleteManyuser_bank_backfill_txs;
    }),
  deleteOneuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.delete(input);
      return deleteOneuser_bank_backfill_txs;
    }),
  findFirstuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.findFirst(input);
      return findFirstuser_bank_backfill_txs;
    }),
  findFirstuser_bank_backfill_txsOrThrow: publicProcedure
    .input(user_bank_backfill_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_bank_backfill_txsOrThrow = await ctx.prisma.user_bank_backfill_txs.findFirstOrThrow(input);
      return findFirstuser_bank_backfill_txsOrThrow;
    }),
  findManyuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.findMany(input);
      return findManyuser_bank_backfill_txs;
    }),
  findUniqueuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.findUnique(input);
      return findUniqueuser_bank_backfill_txs;
    }),
  findUniqueuser_bank_backfill_txsOrThrow: publicProcedure
    .input(user_bank_backfill_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_bank_backfill_txsOrThrow = await ctx.prisma.user_bank_backfill_txs.findUniqueOrThrow(input);
      return findUniqueuser_bank_backfill_txsOrThrow;
    }),
  groupByuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_bank_backfill_txs;
    }),
  updateManyuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.updateMany(input);
      return updateManyuser_bank_backfill_txs;
    }),
  updateOneuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.update(input);
      return updateOneuser_bank_backfill_txs;
    }),
  upsertOneuser_bank_backfill_txs: publicProcedure
    .input(user_bank_backfill_txsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_bank_backfill_txs = await ctx.prisma.user_bank_backfill_txs.upsert(input);
      return upsertOneuser_bank_backfill_txs;
    }),

}) 
