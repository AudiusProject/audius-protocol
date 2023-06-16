import { t, publicProcedure } from "./helpers/createRouter";
import { track_trending_scoresAggregateSchema } from "../schemas/aggregatetrack_trending_scores.schema";
import { track_trending_scoresCreateManySchema } from "../schemas/createManytrack_trending_scores.schema";
import { track_trending_scoresCreateOneSchema } from "../schemas/createOnetrack_trending_scores.schema";
import { track_trending_scoresDeleteManySchema } from "../schemas/deleteManytrack_trending_scores.schema";
import { track_trending_scoresDeleteOneSchema } from "../schemas/deleteOnetrack_trending_scores.schema";
import { track_trending_scoresFindFirstSchema } from "../schemas/findFirsttrack_trending_scores.schema";
import { track_trending_scoresFindManySchema } from "../schemas/findManytrack_trending_scores.schema";
import { track_trending_scoresFindUniqueSchema } from "../schemas/findUniquetrack_trending_scores.schema";
import { track_trending_scoresGroupBySchema } from "../schemas/groupBytrack_trending_scores.schema";
import { track_trending_scoresUpdateManySchema } from "../schemas/updateManytrack_trending_scores.schema";
import { track_trending_scoresUpdateOneSchema } from "../schemas/updateOnetrack_trending_scores.schema";
import { track_trending_scoresUpsertSchema } from "../schemas/upsertOnetrack_trending_scores.schema";

export const track_trending_scoresRouter = t.router({
  aggregatetrack_trending_scores: publicProcedure
    .input(track_trending_scoresAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatetrack_trending_scores = await ctx.prisma.track_trending_scores.aggregate(input);
      return aggregatetrack_trending_scores;
    }),
  createManytrack_trending_scores: publicProcedure
    .input(track_trending_scoresCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManytrack_trending_scores = await ctx.prisma.track_trending_scores.createMany(input);
      return createManytrack_trending_scores;
    }),
  createOnetrack_trending_scores: publicProcedure
    .input(track_trending_scoresCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnetrack_trending_scores = await ctx.prisma.track_trending_scores.create(input);
      return createOnetrack_trending_scores;
    }),
  deleteManytrack_trending_scores: publicProcedure
    .input(track_trending_scoresDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManytrack_trending_scores = await ctx.prisma.track_trending_scores.deleteMany(input);
      return deleteManytrack_trending_scores;
    }),
  deleteOnetrack_trending_scores: publicProcedure
    .input(track_trending_scoresDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnetrack_trending_scores = await ctx.prisma.track_trending_scores.delete(input);
      return deleteOnetrack_trending_scores;
    }),
  findFirsttrack_trending_scores: publicProcedure
    .input(track_trending_scoresFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttrack_trending_scores = await ctx.prisma.track_trending_scores.findFirst(input);
      return findFirsttrack_trending_scores;
    }),
  findFirsttrack_trending_scoresOrThrow: publicProcedure
    .input(track_trending_scoresFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttrack_trending_scoresOrThrow = await ctx.prisma.track_trending_scores.findFirstOrThrow(input);
      return findFirsttrack_trending_scoresOrThrow;
    }),
  findManytrack_trending_scores: publicProcedure
    .input(track_trending_scoresFindManySchema).query(async ({ ctx, input }) => {
      const findManytrack_trending_scores = await ctx.prisma.track_trending_scores.findMany(input);
      return findManytrack_trending_scores;
    }),
  findUniquetrack_trending_scores: publicProcedure
    .input(track_trending_scoresFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetrack_trending_scores = await ctx.prisma.track_trending_scores.findUnique(input);
      return findUniquetrack_trending_scores;
    }),
  findUniquetrack_trending_scoresOrThrow: publicProcedure
    .input(track_trending_scoresFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetrack_trending_scoresOrThrow = await ctx.prisma.track_trending_scores.findUniqueOrThrow(input);
      return findUniquetrack_trending_scoresOrThrow;
    }),
  groupBytrack_trending_scores: publicProcedure
    .input(track_trending_scoresGroupBySchema).query(async ({ ctx, input }) => {
      const groupBytrack_trending_scores = await ctx.prisma.track_trending_scores.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBytrack_trending_scores;
    }),
  updateManytrack_trending_scores: publicProcedure
    .input(track_trending_scoresUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManytrack_trending_scores = await ctx.prisma.track_trending_scores.updateMany(input);
      return updateManytrack_trending_scores;
    }),
  updateOnetrack_trending_scores: publicProcedure
    .input(track_trending_scoresUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnetrack_trending_scores = await ctx.prisma.track_trending_scores.update(input);
      return updateOnetrack_trending_scores;
    }),
  upsertOnetrack_trending_scores: publicProcedure
    .input(track_trending_scoresUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnetrack_trending_scores = await ctx.prisma.track_trending_scores.upsert(input);
      return upsertOnetrack_trending_scores;
    }),

}) 
