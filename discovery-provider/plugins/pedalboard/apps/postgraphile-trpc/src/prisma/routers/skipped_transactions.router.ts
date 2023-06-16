import { t, publicProcedure } from "./helpers/createRouter";
import { skipped_transactionsAggregateSchema } from "../schemas/aggregateskipped_transactions.schema";
import { skipped_transactionsCreateManySchema } from "../schemas/createManyskipped_transactions.schema";
import { skipped_transactionsCreateOneSchema } from "../schemas/createOneskipped_transactions.schema";
import { skipped_transactionsDeleteManySchema } from "../schemas/deleteManyskipped_transactions.schema";
import { skipped_transactionsDeleteOneSchema } from "../schemas/deleteOneskipped_transactions.schema";
import { skipped_transactionsFindFirstSchema } from "../schemas/findFirstskipped_transactions.schema";
import { skipped_transactionsFindManySchema } from "../schemas/findManyskipped_transactions.schema";
import { skipped_transactionsFindUniqueSchema } from "../schemas/findUniqueskipped_transactions.schema";
import { skipped_transactionsGroupBySchema } from "../schemas/groupByskipped_transactions.schema";
import { skipped_transactionsUpdateManySchema } from "../schemas/updateManyskipped_transactions.schema";
import { skipped_transactionsUpdateOneSchema } from "../schemas/updateOneskipped_transactions.schema";
import { skipped_transactionsUpsertSchema } from "../schemas/upsertOneskipped_transactions.schema";

export const skipped_transactionsRouter = t.router({
  aggregateskipped_transactions: publicProcedure
    .input(skipped_transactionsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateskipped_transactions = await ctx.prisma.skipped_transactions.aggregate(input);
      return aggregateskipped_transactions;
    }),
  createManyskipped_transactions: publicProcedure
    .input(skipped_transactionsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyskipped_transactions = await ctx.prisma.skipped_transactions.createMany(input);
      return createManyskipped_transactions;
    }),
  createOneskipped_transactions: publicProcedure
    .input(skipped_transactionsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneskipped_transactions = await ctx.prisma.skipped_transactions.create(input);
      return createOneskipped_transactions;
    }),
  deleteManyskipped_transactions: publicProcedure
    .input(skipped_transactionsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyskipped_transactions = await ctx.prisma.skipped_transactions.deleteMany(input);
      return deleteManyskipped_transactions;
    }),
  deleteOneskipped_transactions: publicProcedure
    .input(skipped_transactionsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneskipped_transactions = await ctx.prisma.skipped_transactions.delete(input);
      return deleteOneskipped_transactions;
    }),
  findFirstskipped_transactions: publicProcedure
    .input(skipped_transactionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstskipped_transactions = await ctx.prisma.skipped_transactions.findFirst(input);
      return findFirstskipped_transactions;
    }),
  findFirstskipped_transactionsOrThrow: publicProcedure
    .input(skipped_transactionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstskipped_transactionsOrThrow = await ctx.prisma.skipped_transactions.findFirstOrThrow(input);
      return findFirstskipped_transactionsOrThrow;
    }),
  findManyskipped_transactions: publicProcedure
    .input(skipped_transactionsFindManySchema).query(async ({ ctx, input }) => {
      const findManyskipped_transactions = await ctx.prisma.skipped_transactions.findMany(input);
      return findManyskipped_transactions;
    }),
  findUniqueskipped_transactions: publicProcedure
    .input(skipped_transactionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueskipped_transactions = await ctx.prisma.skipped_transactions.findUnique(input);
      return findUniqueskipped_transactions;
    }),
  findUniqueskipped_transactionsOrThrow: publicProcedure
    .input(skipped_transactionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueskipped_transactionsOrThrow = await ctx.prisma.skipped_transactions.findUniqueOrThrow(input);
      return findUniqueskipped_transactionsOrThrow;
    }),
  groupByskipped_transactions: publicProcedure
    .input(skipped_transactionsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByskipped_transactions = await ctx.prisma.skipped_transactions.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByskipped_transactions;
    }),
  updateManyskipped_transactions: publicProcedure
    .input(skipped_transactionsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyskipped_transactions = await ctx.prisma.skipped_transactions.updateMany(input);
      return updateManyskipped_transactions;
    }),
  updateOneskipped_transactions: publicProcedure
    .input(skipped_transactionsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneskipped_transactions = await ctx.prisma.skipped_transactions.update(input);
      return updateOneskipped_transactions;
    }),
  upsertOneskipped_transactions: publicProcedure
    .input(skipped_transactionsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneskipped_transactions = await ctx.prisma.skipped_transactions.upsert(input);
      return upsertOneskipped_transactions;
    }),

}) 
