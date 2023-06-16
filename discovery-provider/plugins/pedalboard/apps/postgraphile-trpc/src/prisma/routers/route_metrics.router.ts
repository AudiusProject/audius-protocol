import { t, publicProcedure } from "./helpers/createRouter";
import { route_metricsAggregateSchema } from "../schemas/aggregateroute_metrics.schema";
import { route_metricsCreateManySchema } from "../schemas/createManyroute_metrics.schema";
import { route_metricsCreateOneSchema } from "../schemas/createOneroute_metrics.schema";
import { route_metricsDeleteManySchema } from "../schemas/deleteManyroute_metrics.schema";
import { route_metricsDeleteOneSchema } from "../schemas/deleteOneroute_metrics.schema";
import { route_metricsFindFirstSchema } from "../schemas/findFirstroute_metrics.schema";
import { route_metricsFindManySchema } from "../schemas/findManyroute_metrics.schema";
import { route_metricsFindUniqueSchema } from "../schemas/findUniqueroute_metrics.schema";
import { route_metricsGroupBySchema } from "../schemas/groupByroute_metrics.schema";
import { route_metricsUpdateManySchema } from "../schemas/updateManyroute_metrics.schema";
import { route_metricsUpdateOneSchema } from "../schemas/updateOneroute_metrics.schema";
import { route_metricsUpsertSchema } from "../schemas/upsertOneroute_metrics.schema";

export const route_metricsRouter = t.router({
  aggregateroute_metrics: publicProcedure
    .input(route_metricsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateroute_metrics = await ctx.prisma.route_metrics.aggregate(input);
      return aggregateroute_metrics;
    }),
  createManyroute_metrics: publicProcedure
    .input(route_metricsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyroute_metrics = await ctx.prisma.route_metrics.createMany(input);
      return createManyroute_metrics;
    }),
  createOneroute_metrics: publicProcedure
    .input(route_metricsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneroute_metrics = await ctx.prisma.route_metrics.create(input);
      return createOneroute_metrics;
    }),
  deleteManyroute_metrics: publicProcedure
    .input(route_metricsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyroute_metrics = await ctx.prisma.route_metrics.deleteMany(input);
      return deleteManyroute_metrics;
    }),
  deleteOneroute_metrics: publicProcedure
    .input(route_metricsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneroute_metrics = await ctx.prisma.route_metrics.delete(input);
      return deleteOneroute_metrics;
    }),
  findFirstroute_metrics: publicProcedure
    .input(route_metricsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstroute_metrics = await ctx.prisma.route_metrics.findFirst(input);
      return findFirstroute_metrics;
    }),
  findFirstroute_metricsOrThrow: publicProcedure
    .input(route_metricsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstroute_metricsOrThrow = await ctx.prisma.route_metrics.findFirstOrThrow(input);
      return findFirstroute_metricsOrThrow;
    }),
  findManyroute_metrics: publicProcedure
    .input(route_metricsFindManySchema).query(async ({ ctx, input }) => {
      const findManyroute_metrics = await ctx.prisma.route_metrics.findMany(input);
      return findManyroute_metrics;
    }),
  findUniqueroute_metrics: publicProcedure
    .input(route_metricsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueroute_metrics = await ctx.prisma.route_metrics.findUnique(input);
      return findUniqueroute_metrics;
    }),
  findUniqueroute_metricsOrThrow: publicProcedure
    .input(route_metricsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueroute_metricsOrThrow = await ctx.prisma.route_metrics.findUniqueOrThrow(input);
      return findUniqueroute_metricsOrThrow;
    }),
  groupByroute_metrics: publicProcedure
    .input(route_metricsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByroute_metrics = await ctx.prisma.route_metrics.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByroute_metrics;
    }),
  updateManyroute_metrics: publicProcedure
    .input(route_metricsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyroute_metrics = await ctx.prisma.route_metrics.updateMany(input);
      return updateManyroute_metrics;
    }),
  updateOneroute_metrics: publicProcedure
    .input(route_metricsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneroute_metrics = await ctx.prisma.route_metrics.update(input);
      return updateOneroute_metrics;
    }),
  upsertOneroute_metrics: publicProcedure
    .input(route_metricsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneroute_metrics = await ctx.prisma.route_metrics.upsert(input);
      return upsertOneroute_metrics;
    }),

}) 
