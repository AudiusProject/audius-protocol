import { t, publicProcedure } from "./helpers/createRouter";
import { trending_resultsAggregateSchema } from "../schemas/aggregatetrending_results.schema";
import { trending_resultsCreateManySchema } from "../schemas/createManytrending_results.schema";
import { trending_resultsCreateOneSchema } from "../schemas/createOnetrending_results.schema";
import { trending_resultsDeleteManySchema } from "../schemas/deleteManytrending_results.schema";
import { trending_resultsDeleteOneSchema } from "../schemas/deleteOnetrending_results.schema";
import { trending_resultsFindFirstSchema } from "../schemas/findFirsttrending_results.schema";
import { trending_resultsFindManySchema } from "../schemas/findManytrending_results.schema";
import { trending_resultsFindUniqueSchema } from "../schemas/findUniquetrending_results.schema";
import { trending_resultsGroupBySchema } from "../schemas/groupBytrending_results.schema";
import { trending_resultsUpdateManySchema } from "../schemas/updateManytrending_results.schema";
import { trending_resultsUpdateOneSchema } from "../schemas/updateOnetrending_results.schema";
import { trending_resultsUpsertSchema } from "../schemas/upsertOnetrending_results.schema";

export const trending_resultsRouter = t.router({
  aggregatetrending_results: publicProcedure
    .input(trending_resultsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatetrending_results = await ctx.prisma.trending_results.aggregate(input);
      return aggregatetrending_results;
    }),
  createManytrending_results: publicProcedure
    .input(trending_resultsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManytrending_results = await ctx.prisma.trending_results.createMany(input);
      return createManytrending_results;
    }),
  createOnetrending_results: publicProcedure
    .input(trending_resultsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnetrending_results = await ctx.prisma.trending_results.create(input);
      return createOnetrending_results;
    }),
  deleteManytrending_results: publicProcedure
    .input(trending_resultsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManytrending_results = await ctx.prisma.trending_results.deleteMany(input);
      return deleteManytrending_results;
    }),
  deleteOnetrending_results: publicProcedure
    .input(trending_resultsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnetrending_results = await ctx.prisma.trending_results.delete(input);
      return deleteOnetrending_results;
    }),
  findFirsttrending_results: publicProcedure
    .input(trending_resultsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttrending_results = await ctx.prisma.trending_results.findFirst(input);
      return findFirsttrending_results;
    }),
  findFirsttrending_resultsOrThrow: publicProcedure
    .input(trending_resultsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttrending_resultsOrThrow = await ctx.prisma.trending_results.findFirstOrThrow(input);
      return findFirsttrending_resultsOrThrow;
    }),
  findManytrending_results: publicProcedure
    .input(trending_resultsFindManySchema).query(async ({ ctx, input }) => {
      const findManytrending_results = await ctx.prisma.trending_results.findMany(input);
      return findManytrending_results;
    }),
  findUniquetrending_results: publicProcedure
    .input(trending_resultsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetrending_results = await ctx.prisma.trending_results.findUnique(input);
      return findUniquetrending_results;
    }),
  findUniquetrending_resultsOrThrow: publicProcedure
    .input(trending_resultsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetrending_resultsOrThrow = await ctx.prisma.trending_results.findUniqueOrThrow(input);
      return findUniquetrending_resultsOrThrow;
    }),
  groupBytrending_results: publicProcedure
    .input(trending_resultsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBytrending_results = await ctx.prisma.trending_results.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBytrending_results;
    }),
  updateManytrending_results: publicProcedure
    .input(trending_resultsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManytrending_results = await ctx.prisma.trending_results.updateMany(input);
      return updateManytrending_results;
    }),
  updateOnetrending_results: publicProcedure
    .input(trending_resultsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnetrending_results = await ctx.prisma.trending_results.update(input);
      return updateOnetrending_results;
    }),
  upsertOnetrending_results: publicProcedure
    .input(trending_resultsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnetrending_results = await ctx.prisma.trending_results.upsert(input);
      return upsertOnetrending_results;
    }),

}) 
