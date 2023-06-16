import { t, publicProcedure } from "./helpers/createRouter";
import { aggregate_monthly_playsAggregateSchema } from "../schemas/aggregateaggregate_monthly_plays.schema";
import { aggregate_monthly_playsCreateManySchema } from "../schemas/createManyaggregate_monthly_plays.schema";
import { aggregate_monthly_playsCreateOneSchema } from "../schemas/createOneaggregate_monthly_plays.schema";
import { aggregate_monthly_playsDeleteManySchema } from "../schemas/deleteManyaggregate_monthly_plays.schema";
import { aggregate_monthly_playsDeleteOneSchema } from "../schemas/deleteOneaggregate_monthly_plays.schema";
import { aggregate_monthly_playsFindFirstSchema } from "../schemas/findFirstaggregate_monthly_plays.schema";
import { aggregate_monthly_playsFindManySchema } from "../schemas/findManyaggregate_monthly_plays.schema";
import { aggregate_monthly_playsFindUniqueSchema } from "../schemas/findUniqueaggregate_monthly_plays.schema";
import { aggregate_monthly_playsGroupBySchema } from "../schemas/groupByaggregate_monthly_plays.schema";
import { aggregate_monthly_playsUpdateManySchema } from "../schemas/updateManyaggregate_monthly_plays.schema";
import { aggregate_monthly_playsUpdateOneSchema } from "../schemas/updateOneaggregate_monthly_plays.schema";
import { aggregate_monthly_playsUpsertSchema } from "../schemas/upsertOneaggregate_monthly_plays.schema";

export const aggregate_monthly_playsRouter = t.router({
  aggregateaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.aggregate(input);
      return aggregateaggregate_monthly_plays;
    }),
  createManyaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.createMany(input);
      return createManyaggregate_monthly_plays;
    }),
  createOneaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.create(input);
      return createOneaggregate_monthly_plays;
    }),
  deleteManyaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.deleteMany(input);
      return deleteManyaggregate_monthly_plays;
    }),
  deleteOneaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.delete(input);
      return deleteOneaggregate_monthly_plays;
    }),
  findFirstaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.findFirst(input);
      return findFirstaggregate_monthly_plays;
    }),
  findFirstaggregate_monthly_playsOrThrow: publicProcedure
    .input(aggregate_monthly_playsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_monthly_playsOrThrow = await ctx.prisma.aggregate_monthly_plays.findFirstOrThrow(input);
      return findFirstaggregate_monthly_playsOrThrow;
    }),
  findManyaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsFindManySchema).query(async ({ ctx, input }) => {
      const findManyaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.findMany(input);
      return findManyaggregate_monthly_plays;
    }),
  findUniqueaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.findUnique(input);
      return findUniqueaggregate_monthly_plays;
    }),
  findUniqueaggregate_monthly_playsOrThrow: publicProcedure
    .input(aggregate_monthly_playsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_monthly_playsOrThrow = await ctx.prisma.aggregate_monthly_plays.findUniqueOrThrow(input);
      return findUniqueaggregate_monthly_playsOrThrow;
    }),
  groupByaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaggregate_monthly_plays;
    }),
  updateManyaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.updateMany(input);
      return updateManyaggregate_monthly_plays;
    }),
  updateOneaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.update(input);
      return updateOneaggregate_monthly_plays;
    }),
  upsertOneaggregate_monthly_plays: publicProcedure
    .input(aggregate_monthly_playsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaggregate_monthly_plays = await ctx.prisma.aggregate_monthly_plays.upsert(input);
      return upsertOneaggregate_monthly_plays;
    }),

}) 
