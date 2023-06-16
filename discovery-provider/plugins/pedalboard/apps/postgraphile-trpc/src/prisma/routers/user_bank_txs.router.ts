import { t, publicProcedure } from "./helpers/createRouter";
import { user_bank_txsAggregateSchema } from "../schemas/aggregateuser_bank_txs.schema";
import { user_bank_txsCreateManySchema } from "../schemas/createManyuser_bank_txs.schema";
import { user_bank_txsCreateOneSchema } from "../schemas/createOneuser_bank_txs.schema";
import { user_bank_txsDeleteManySchema } from "../schemas/deleteManyuser_bank_txs.schema";
import { user_bank_txsDeleteOneSchema } from "../schemas/deleteOneuser_bank_txs.schema";
import { user_bank_txsFindFirstSchema } from "../schemas/findFirstuser_bank_txs.schema";
import { user_bank_txsFindManySchema } from "../schemas/findManyuser_bank_txs.schema";
import { user_bank_txsFindUniqueSchema } from "../schemas/findUniqueuser_bank_txs.schema";
import { user_bank_txsGroupBySchema } from "../schemas/groupByuser_bank_txs.schema";
import { user_bank_txsUpdateManySchema } from "../schemas/updateManyuser_bank_txs.schema";
import { user_bank_txsUpdateOneSchema } from "../schemas/updateOneuser_bank_txs.schema";
import { user_bank_txsUpsertSchema } from "../schemas/upsertOneuser_bank_txs.schema";

export const user_bank_txsRouter = t.router({
  aggregateuser_bank_txs: publicProcedure
    .input(user_bank_txsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_bank_txs = await ctx.prisma.user_bank_txs.aggregate(input);
      return aggregateuser_bank_txs;
    }),
  createManyuser_bank_txs: publicProcedure
    .input(user_bank_txsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_bank_txs = await ctx.prisma.user_bank_txs.createMany(input);
      return createManyuser_bank_txs;
    }),
  createOneuser_bank_txs: publicProcedure
    .input(user_bank_txsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_bank_txs = await ctx.prisma.user_bank_txs.create(input);
      return createOneuser_bank_txs;
    }),
  deleteManyuser_bank_txs: publicProcedure
    .input(user_bank_txsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_bank_txs = await ctx.prisma.user_bank_txs.deleteMany(input);
      return deleteManyuser_bank_txs;
    }),
  deleteOneuser_bank_txs: publicProcedure
    .input(user_bank_txsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_bank_txs = await ctx.prisma.user_bank_txs.delete(input);
      return deleteOneuser_bank_txs;
    }),
  findFirstuser_bank_txs: publicProcedure
    .input(user_bank_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_bank_txs = await ctx.prisma.user_bank_txs.findFirst(input);
      return findFirstuser_bank_txs;
    }),
  findFirstuser_bank_txsOrThrow: publicProcedure
    .input(user_bank_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_bank_txsOrThrow = await ctx.prisma.user_bank_txs.findFirstOrThrow(input);
      return findFirstuser_bank_txsOrThrow;
    }),
  findManyuser_bank_txs: publicProcedure
    .input(user_bank_txsFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_bank_txs = await ctx.prisma.user_bank_txs.findMany(input);
      return findManyuser_bank_txs;
    }),
  findUniqueuser_bank_txs: publicProcedure
    .input(user_bank_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_bank_txs = await ctx.prisma.user_bank_txs.findUnique(input);
      return findUniqueuser_bank_txs;
    }),
  findUniqueuser_bank_txsOrThrow: publicProcedure
    .input(user_bank_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_bank_txsOrThrow = await ctx.prisma.user_bank_txs.findUniqueOrThrow(input);
      return findUniqueuser_bank_txsOrThrow;
    }),
  groupByuser_bank_txs: publicProcedure
    .input(user_bank_txsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_bank_txs = await ctx.prisma.user_bank_txs.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_bank_txs;
    }),
  updateManyuser_bank_txs: publicProcedure
    .input(user_bank_txsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_bank_txs = await ctx.prisma.user_bank_txs.updateMany(input);
      return updateManyuser_bank_txs;
    }),
  updateOneuser_bank_txs: publicProcedure
    .input(user_bank_txsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_bank_txs = await ctx.prisma.user_bank_txs.update(input);
      return updateOneuser_bank_txs;
    }),
  upsertOneuser_bank_txs: publicProcedure
    .input(user_bank_txsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_bank_txs = await ctx.prisma.user_bank_txs.upsert(input);
      return upsertOneuser_bank_txs;
    }),

}) 
