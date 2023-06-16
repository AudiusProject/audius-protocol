import { t, publicProcedure } from "./helpers/createRouter";
import { aggregate_daily_app_name_metricsAggregateSchema } from "../schemas/aggregateaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsCreateManySchema } from "../schemas/createManyaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsCreateOneSchema } from "../schemas/createOneaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsDeleteManySchema } from "../schemas/deleteManyaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsDeleteOneSchema } from "../schemas/deleteOneaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsFindFirstSchema } from "../schemas/findFirstaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsFindManySchema } from "../schemas/findManyaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsFindUniqueSchema } from "../schemas/findUniqueaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsGroupBySchema } from "../schemas/groupByaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsUpdateManySchema } from "../schemas/updateManyaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsUpdateOneSchema } from "../schemas/updateOneaggregate_daily_app_name_metrics.schema";
import { aggregate_daily_app_name_metricsUpsertSchema } from "../schemas/upsertOneaggregate_daily_app_name_metrics.schema";

export const aggregate_daily_app_name_metricsRouter = t.router({
  aggregateaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.aggregate(input);
      return aggregateaggregate_daily_app_name_metrics;
    }),
  createManyaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.createMany(input);
      return createManyaggregate_daily_app_name_metrics;
    }),
  createOneaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.create(input);
      return createOneaggregate_daily_app_name_metrics;
    }),
  deleteManyaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.deleteMany(input);
      return deleteManyaggregate_daily_app_name_metrics;
    }),
  deleteOneaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.delete(input);
      return deleteOneaggregate_daily_app_name_metrics;
    }),
  findFirstaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.findFirst(input);
      return findFirstaggregate_daily_app_name_metrics;
    }),
  findFirstaggregate_daily_app_name_metricsOrThrow: publicProcedure
    .input(aggregate_daily_app_name_metricsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_daily_app_name_metricsOrThrow = await ctx.prisma.aggregate_daily_app_name_metrics.findFirstOrThrow(input);
      return findFirstaggregate_daily_app_name_metricsOrThrow;
    }),
  findManyaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsFindManySchema).query(async ({ ctx, input }) => {
      const findManyaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.findMany(input);
      return findManyaggregate_daily_app_name_metrics;
    }),
  findUniqueaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.findUnique(input);
      return findUniqueaggregate_daily_app_name_metrics;
    }),
  findUniqueaggregate_daily_app_name_metricsOrThrow: publicProcedure
    .input(aggregate_daily_app_name_metricsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_daily_app_name_metricsOrThrow = await ctx.prisma.aggregate_daily_app_name_metrics.findUniqueOrThrow(input);
      return findUniqueaggregate_daily_app_name_metricsOrThrow;
    }),
  groupByaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaggregate_daily_app_name_metrics;
    }),
  updateManyaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.updateMany(input);
      return updateManyaggregate_daily_app_name_metrics;
    }),
  updateOneaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.update(input);
      return updateOneaggregate_daily_app_name_metrics;
    }),
  upsertOneaggregate_daily_app_name_metrics: publicProcedure
    .input(aggregate_daily_app_name_metricsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaggregate_daily_app_name_metrics = await ctx.prisma.aggregate_daily_app_name_metrics.upsert(input);
      return upsertOneaggregate_daily_app_name_metrics;
    }),

}) 
