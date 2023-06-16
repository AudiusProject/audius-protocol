import { t, publicProcedure } from "./helpers/createRouter";
import { aggregate_daily_total_users_metricsAggregateSchema } from "../schemas/aggregateaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsCreateManySchema } from "../schemas/createManyaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsCreateOneSchema } from "../schemas/createOneaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsDeleteManySchema } from "../schemas/deleteManyaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsDeleteOneSchema } from "../schemas/deleteOneaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsFindFirstSchema } from "../schemas/findFirstaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsFindManySchema } from "../schemas/findManyaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsFindUniqueSchema } from "../schemas/findUniqueaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsGroupBySchema } from "../schemas/groupByaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsUpdateManySchema } from "../schemas/updateManyaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsUpdateOneSchema } from "../schemas/updateOneaggregate_daily_total_users_metrics.schema";
import { aggregate_daily_total_users_metricsUpsertSchema } from "../schemas/upsertOneaggregate_daily_total_users_metrics.schema";

export const aggregate_daily_total_users_metricsRouter = t.router({
  aggregateaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.aggregate(input);
      return aggregateaggregate_daily_total_users_metrics;
    }),
  createManyaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.createMany(input);
      return createManyaggregate_daily_total_users_metrics;
    }),
  createOneaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.create(input);
      return createOneaggregate_daily_total_users_metrics;
    }),
  deleteManyaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.deleteMany(input);
      return deleteManyaggregate_daily_total_users_metrics;
    }),
  deleteOneaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.delete(input);
      return deleteOneaggregate_daily_total_users_metrics;
    }),
  findFirstaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.findFirst(input);
      return findFirstaggregate_daily_total_users_metrics;
    }),
  findFirstaggregate_daily_total_users_metricsOrThrow: publicProcedure
    .input(aggregate_daily_total_users_metricsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_daily_total_users_metricsOrThrow = await ctx.prisma.aggregate_daily_total_users_metrics.findFirstOrThrow(input);
      return findFirstaggregate_daily_total_users_metricsOrThrow;
    }),
  findManyaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsFindManySchema).query(async ({ ctx, input }) => {
      const findManyaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.findMany(input);
      return findManyaggregate_daily_total_users_metrics;
    }),
  findUniqueaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.findUnique(input);
      return findUniqueaggregate_daily_total_users_metrics;
    }),
  findUniqueaggregate_daily_total_users_metricsOrThrow: publicProcedure
    .input(aggregate_daily_total_users_metricsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_daily_total_users_metricsOrThrow = await ctx.prisma.aggregate_daily_total_users_metrics.findUniqueOrThrow(input);
      return findUniqueaggregate_daily_total_users_metricsOrThrow;
    }),
  groupByaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaggregate_daily_total_users_metrics;
    }),
  updateManyaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.updateMany(input);
      return updateManyaggregate_daily_total_users_metrics;
    }),
  updateOneaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.update(input);
      return updateOneaggregate_daily_total_users_metrics;
    }),
  upsertOneaggregate_daily_total_users_metrics: publicProcedure
    .input(aggregate_daily_total_users_metricsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaggregate_daily_total_users_metrics = await ctx.prisma.aggregate_daily_total_users_metrics.upsert(input);
      return upsertOneaggregate_daily_total_users_metrics;
    }),

}) 
