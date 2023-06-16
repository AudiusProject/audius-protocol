import { t, publicProcedure } from "./helpers/createRouter";
import { audius_data_txsAggregateSchema } from "../schemas/aggregateaudius_data_txs.schema";
import { audius_data_txsCreateManySchema } from "../schemas/createManyaudius_data_txs.schema";
import { audius_data_txsCreateOneSchema } from "../schemas/createOneaudius_data_txs.schema";
import { audius_data_txsDeleteManySchema } from "../schemas/deleteManyaudius_data_txs.schema";
import { audius_data_txsDeleteOneSchema } from "../schemas/deleteOneaudius_data_txs.schema";
import { audius_data_txsFindFirstSchema } from "../schemas/findFirstaudius_data_txs.schema";
import { audius_data_txsFindManySchema } from "../schemas/findManyaudius_data_txs.schema";
import { audius_data_txsFindUniqueSchema } from "../schemas/findUniqueaudius_data_txs.schema";
import { audius_data_txsGroupBySchema } from "../schemas/groupByaudius_data_txs.schema";
import { audius_data_txsUpdateManySchema } from "../schemas/updateManyaudius_data_txs.schema";
import { audius_data_txsUpdateOneSchema } from "../schemas/updateOneaudius_data_txs.schema";
import { audius_data_txsUpsertSchema } from "../schemas/upsertOneaudius_data_txs.schema";

export const audius_data_txsRouter = t.router({
  aggregateaudius_data_txs: publicProcedure
    .input(audius_data_txsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaudius_data_txs = await ctx.prisma.audius_data_txs.aggregate(input);
      return aggregateaudius_data_txs;
    }),
  createManyaudius_data_txs: publicProcedure
    .input(audius_data_txsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaudius_data_txs = await ctx.prisma.audius_data_txs.createMany(input);
      return createManyaudius_data_txs;
    }),
  createOneaudius_data_txs: publicProcedure
    .input(audius_data_txsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaudius_data_txs = await ctx.prisma.audius_data_txs.create(input);
      return createOneaudius_data_txs;
    }),
  deleteManyaudius_data_txs: publicProcedure
    .input(audius_data_txsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaudius_data_txs = await ctx.prisma.audius_data_txs.deleteMany(input);
      return deleteManyaudius_data_txs;
    }),
  deleteOneaudius_data_txs: publicProcedure
    .input(audius_data_txsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaudius_data_txs = await ctx.prisma.audius_data_txs.delete(input);
      return deleteOneaudius_data_txs;
    }),
  findFirstaudius_data_txs: publicProcedure
    .input(audius_data_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaudius_data_txs = await ctx.prisma.audius_data_txs.findFirst(input);
      return findFirstaudius_data_txs;
    }),
  findFirstaudius_data_txsOrThrow: publicProcedure
    .input(audius_data_txsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaudius_data_txsOrThrow = await ctx.prisma.audius_data_txs.findFirstOrThrow(input);
      return findFirstaudius_data_txsOrThrow;
    }),
  findManyaudius_data_txs: publicProcedure
    .input(audius_data_txsFindManySchema).query(async ({ ctx, input }) => {
      const findManyaudius_data_txs = await ctx.prisma.audius_data_txs.findMany(input);
      return findManyaudius_data_txs;
    }),
  findUniqueaudius_data_txs: publicProcedure
    .input(audius_data_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaudius_data_txs = await ctx.prisma.audius_data_txs.findUnique(input);
      return findUniqueaudius_data_txs;
    }),
  findUniqueaudius_data_txsOrThrow: publicProcedure
    .input(audius_data_txsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaudius_data_txsOrThrow = await ctx.prisma.audius_data_txs.findUniqueOrThrow(input);
      return findUniqueaudius_data_txsOrThrow;
    }),
  groupByaudius_data_txs: publicProcedure
    .input(audius_data_txsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaudius_data_txs = await ctx.prisma.audius_data_txs.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaudius_data_txs;
    }),
  updateManyaudius_data_txs: publicProcedure
    .input(audius_data_txsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaudius_data_txs = await ctx.prisma.audius_data_txs.updateMany(input);
      return updateManyaudius_data_txs;
    }),
  updateOneaudius_data_txs: publicProcedure
    .input(audius_data_txsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaudius_data_txs = await ctx.prisma.audius_data_txs.update(input);
      return updateOneaudius_data_txs;
    }),
  upsertOneaudius_data_txs: publicProcedure
    .input(audius_data_txsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaudius_data_txs = await ctx.prisma.audius_data_txs.upsert(input);
      return upsertOneaudius_data_txs;
    }),

}) 
