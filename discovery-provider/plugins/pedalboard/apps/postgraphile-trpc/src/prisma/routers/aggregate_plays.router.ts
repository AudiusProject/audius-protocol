import { t, publicProcedure } from "./helpers/createRouter";
import { aggregate_playsAggregateSchema } from "../schemas/aggregateaggregate_plays.schema";
import { aggregate_playsCreateManySchema } from "../schemas/createManyaggregate_plays.schema";
import { aggregate_playsCreateOneSchema } from "../schemas/createOneaggregate_plays.schema";
import { aggregate_playsDeleteManySchema } from "../schemas/deleteManyaggregate_plays.schema";
import { aggregate_playsDeleteOneSchema } from "../schemas/deleteOneaggregate_plays.schema";
import { aggregate_playsFindFirstSchema } from "../schemas/findFirstaggregate_plays.schema";
import { aggregate_playsFindManySchema } from "../schemas/findManyaggregate_plays.schema";
import { aggregate_playsFindUniqueSchema } from "../schemas/findUniqueaggregate_plays.schema";
import { aggregate_playsGroupBySchema } from "../schemas/groupByaggregate_plays.schema";
import { aggregate_playsUpdateManySchema } from "../schemas/updateManyaggregate_plays.schema";
import { aggregate_playsUpdateOneSchema } from "../schemas/updateOneaggregate_plays.schema";
import { aggregate_playsUpsertSchema } from "../schemas/upsertOneaggregate_plays.schema";

export const aggregate_playsRouter = t.router({
  aggregateaggregate_plays: publicProcedure
    .input(aggregate_playsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaggregate_plays = await ctx.prisma.aggregate_plays.aggregate(input);
      return aggregateaggregate_plays;
    }),
  createManyaggregate_plays: publicProcedure
    .input(aggregate_playsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaggregate_plays = await ctx.prisma.aggregate_plays.createMany(input);
      return createManyaggregate_plays;
    }),
  createOneaggregate_plays: publicProcedure
    .input(aggregate_playsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaggregate_plays = await ctx.prisma.aggregate_plays.create(input);
      return createOneaggregate_plays;
    }),
  deleteManyaggregate_plays: publicProcedure
    .input(aggregate_playsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaggregate_plays = await ctx.prisma.aggregate_plays.deleteMany(input);
      return deleteManyaggregate_plays;
    }),
  deleteOneaggregate_plays: publicProcedure
    .input(aggregate_playsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaggregate_plays = await ctx.prisma.aggregate_plays.delete(input);
      return deleteOneaggregate_plays;
    }),
  findFirstaggregate_plays: publicProcedure
    .input(aggregate_playsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_plays = await ctx.prisma.aggregate_plays.findFirst(input);
      return findFirstaggregate_plays;
    }),
  findFirstaggregate_playsOrThrow: publicProcedure
    .input(aggregate_playsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_playsOrThrow = await ctx.prisma.aggregate_plays.findFirstOrThrow(input);
      return findFirstaggregate_playsOrThrow;
    }),
  findManyaggregate_plays: publicProcedure
    .input(aggregate_playsFindManySchema).query(async ({ ctx, input }) => {
      const findManyaggregate_plays = await ctx.prisma.aggregate_plays.findMany(input);
      return findManyaggregate_plays;
    }),
  findUniqueaggregate_plays: publicProcedure
    .input(aggregate_playsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_plays = await ctx.prisma.aggregate_plays.findUnique(input);
      return findUniqueaggregate_plays;
    }),
  findUniqueaggregate_playsOrThrow: publicProcedure
    .input(aggregate_playsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_playsOrThrow = await ctx.prisma.aggregate_plays.findUniqueOrThrow(input);
      return findUniqueaggregate_playsOrThrow;
    }),
  groupByaggregate_plays: publicProcedure
    .input(aggregate_playsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaggregate_plays = await ctx.prisma.aggregate_plays.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaggregate_plays;
    }),
  updateManyaggregate_plays: publicProcedure
    .input(aggregate_playsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaggregate_plays = await ctx.prisma.aggregate_plays.updateMany(input);
      return updateManyaggregate_plays;
    }),
  updateOneaggregate_plays: publicProcedure
    .input(aggregate_playsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaggregate_plays = await ctx.prisma.aggregate_plays.update(input);
      return updateOneaggregate_plays;
    }),
  upsertOneaggregate_plays: publicProcedure
    .input(aggregate_playsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaggregate_plays = await ctx.prisma.aggregate_plays.upsert(input);
      return upsertOneaggregate_plays;
    }),

}) 
