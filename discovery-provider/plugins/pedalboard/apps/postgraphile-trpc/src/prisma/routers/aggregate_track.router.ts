import { t, publicProcedure } from "./helpers/createRouter";
import { aggregate_trackAggregateSchema } from "../schemas/aggregateaggregate_track.schema";
import { aggregate_trackCreateManySchema } from "../schemas/createManyaggregate_track.schema";
import { aggregate_trackCreateOneSchema } from "../schemas/createOneaggregate_track.schema";
import { aggregate_trackDeleteManySchema } from "../schemas/deleteManyaggregate_track.schema";
import { aggregate_trackDeleteOneSchema } from "../schemas/deleteOneaggregate_track.schema";
import { aggregate_trackFindFirstSchema } from "../schemas/findFirstaggregate_track.schema";
import { aggregate_trackFindManySchema } from "../schemas/findManyaggregate_track.schema";
import { aggregate_trackFindUniqueSchema } from "../schemas/findUniqueaggregate_track.schema";
import { aggregate_trackGroupBySchema } from "../schemas/groupByaggregate_track.schema";
import { aggregate_trackUpdateManySchema } from "../schemas/updateManyaggregate_track.schema";
import { aggregate_trackUpdateOneSchema } from "../schemas/updateOneaggregate_track.schema";
import { aggregate_trackUpsertSchema } from "../schemas/upsertOneaggregate_track.schema";

export const aggregate_tracksRouter = t.router({
  aggregateaggregate_track: publicProcedure
    .input(aggregate_trackAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaggregate_track = await ctx.prisma.aggregate_track.aggregate(input);
      return aggregateaggregate_track;
    }),
  createManyaggregate_track: publicProcedure
    .input(aggregate_trackCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaggregate_track = await ctx.prisma.aggregate_track.createMany(input);
      return createManyaggregate_track;
    }),
  createOneaggregate_track: publicProcedure
    .input(aggregate_trackCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaggregate_track = await ctx.prisma.aggregate_track.create(input);
      return createOneaggregate_track;
    }),
  deleteManyaggregate_track: publicProcedure
    .input(aggregate_trackDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaggregate_track = await ctx.prisma.aggregate_track.deleteMany(input);
      return deleteManyaggregate_track;
    }),
  deleteOneaggregate_track: publicProcedure
    .input(aggregate_trackDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaggregate_track = await ctx.prisma.aggregate_track.delete(input);
      return deleteOneaggregate_track;
    }),
  findFirstaggregate_track: publicProcedure
    .input(aggregate_trackFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_track = await ctx.prisma.aggregate_track.findFirst(input);
      return findFirstaggregate_track;
    }),
  findFirstaggregate_trackOrThrow: publicProcedure
    .input(aggregate_trackFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_trackOrThrow = await ctx.prisma.aggregate_track.findFirstOrThrow(input);
      return findFirstaggregate_trackOrThrow;
    }),
  findManyaggregate_track: publicProcedure
    .input(aggregate_trackFindManySchema).query(async ({ ctx, input }) => {
      const findManyaggregate_track = await ctx.prisma.aggregate_track.findMany(input);
      return findManyaggregate_track;
    }),
  findUniqueaggregate_track: publicProcedure
    .input(aggregate_trackFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_track = await ctx.prisma.aggregate_track.findUnique(input);
      return findUniqueaggregate_track;
    }),
  findUniqueaggregate_trackOrThrow: publicProcedure
    .input(aggregate_trackFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_trackOrThrow = await ctx.prisma.aggregate_track.findUniqueOrThrow(input);
      return findUniqueaggregate_trackOrThrow;
    }),
  groupByaggregate_track: publicProcedure
    .input(aggregate_trackGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaggregate_track = await ctx.prisma.aggregate_track.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaggregate_track;
    }),
  updateManyaggregate_track: publicProcedure
    .input(aggregate_trackUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaggregate_track = await ctx.prisma.aggregate_track.updateMany(input);
      return updateManyaggregate_track;
    }),
  updateOneaggregate_track: publicProcedure
    .input(aggregate_trackUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaggregate_track = await ctx.prisma.aggregate_track.update(input);
      return updateOneaggregate_track;
    }),
  upsertOneaggregate_track: publicProcedure
    .input(aggregate_trackUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaggregate_track = await ctx.prisma.aggregate_track.upsert(input);
      return upsertOneaggregate_track;
    }),

}) 
