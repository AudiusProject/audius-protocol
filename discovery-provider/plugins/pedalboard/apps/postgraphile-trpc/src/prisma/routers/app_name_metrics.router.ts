import { t, publicProcedure } from "./helpers/createRouter";
import { app_name_metricsAggregateSchema } from "../schemas/aggregateapp_name_metrics.schema";
import { app_name_metricsCreateManySchema } from "../schemas/createManyapp_name_metrics.schema";
import { app_name_metricsCreateOneSchema } from "../schemas/createOneapp_name_metrics.schema";
import { app_name_metricsDeleteManySchema } from "../schemas/deleteManyapp_name_metrics.schema";
import { app_name_metricsDeleteOneSchema } from "../schemas/deleteOneapp_name_metrics.schema";
import { app_name_metricsFindFirstSchema } from "../schemas/findFirstapp_name_metrics.schema";
import { app_name_metricsFindManySchema } from "../schemas/findManyapp_name_metrics.schema";
import { app_name_metricsFindUniqueSchema } from "../schemas/findUniqueapp_name_metrics.schema";
import { app_name_metricsGroupBySchema } from "../schemas/groupByapp_name_metrics.schema";
import { app_name_metricsUpdateManySchema } from "../schemas/updateManyapp_name_metrics.schema";
import { app_name_metricsUpdateOneSchema } from "../schemas/updateOneapp_name_metrics.schema";
import { app_name_metricsUpsertSchema } from "../schemas/upsertOneapp_name_metrics.schema";

export const app_name_metricsRouter = t.router({
  aggregateapp_name_metrics: publicProcedure
    .input(app_name_metricsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateapp_name_metrics = await ctx.prisma.app_name_metrics.aggregate(input);
      return aggregateapp_name_metrics;
    }),
  createManyapp_name_metrics: publicProcedure
    .input(app_name_metricsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyapp_name_metrics = await ctx.prisma.app_name_metrics.createMany(input);
      return createManyapp_name_metrics;
    }),
  createOneapp_name_metrics: publicProcedure
    .input(app_name_metricsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneapp_name_metrics = await ctx.prisma.app_name_metrics.create(input);
      return createOneapp_name_metrics;
    }),
  deleteManyapp_name_metrics: publicProcedure
    .input(app_name_metricsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyapp_name_metrics = await ctx.prisma.app_name_metrics.deleteMany(input);
      return deleteManyapp_name_metrics;
    }),
  deleteOneapp_name_metrics: publicProcedure
    .input(app_name_metricsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneapp_name_metrics = await ctx.prisma.app_name_metrics.delete(input);
      return deleteOneapp_name_metrics;
    }),
  findFirstapp_name_metrics: publicProcedure
    .input(app_name_metricsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstapp_name_metrics = await ctx.prisma.app_name_metrics.findFirst(input);
      return findFirstapp_name_metrics;
    }),
  findFirstapp_name_metricsOrThrow: publicProcedure
    .input(app_name_metricsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstapp_name_metricsOrThrow = await ctx.prisma.app_name_metrics.findFirstOrThrow(input);
      return findFirstapp_name_metricsOrThrow;
    }),
  findManyapp_name_metrics: publicProcedure
    .input(app_name_metricsFindManySchema).query(async ({ ctx, input }) => {
      const findManyapp_name_metrics = await ctx.prisma.app_name_metrics.findMany(input);
      return findManyapp_name_metrics;
    }),
  findUniqueapp_name_metrics: publicProcedure
    .input(app_name_metricsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueapp_name_metrics = await ctx.prisma.app_name_metrics.findUnique(input);
      return findUniqueapp_name_metrics;
    }),
  findUniqueapp_name_metricsOrThrow: publicProcedure
    .input(app_name_metricsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueapp_name_metricsOrThrow = await ctx.prisma.app_name_metrics.findUniqueOrThrow(input);
      return findUniqueapp_name_metricsOrThrow;
    }),
  groupByapp_name_metrics: publicProcedure
    .input(app_name_metricsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByapp_name_metrics = await ctx.prisma.app_name_metrics.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByapp_name_metrics;
    }),
  updateManyapp_name_metrics: publicProcedure
    .input(app_name_metricsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyapp_name_metrics = await ctx.prisma.app_name_metrics.updateMany(input);
      return updateManyapp_name_metrics;
    }),
  updateOneapp_name_metrics: publicProcedure
    .input(app_name_metricsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneapp_name_metrics = await ctx.prisma.app_name_metrics.update(input);
      return updateOneapp_name_metrics;
    }),
  upsertOneapp_name_metrics: publicProcedure
    .input(app_name_metricsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneapp_name_metrics = await ctx.prisma.app_name_metrics.upsert(input);
      return upsertOneapp_name_metrics;
    }),

}) 
