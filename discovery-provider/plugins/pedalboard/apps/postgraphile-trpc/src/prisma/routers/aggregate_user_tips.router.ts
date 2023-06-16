import { t, publicProcedure } from "./helpers/createRouter";
import { aggregate_user_tipsAggregateSchema } from "../schemas/aggregateaggregate_user_tips.schema";
import { aggregate_user_tipsCreateManySchema } from "../schemas/createManyaggregate_user_tips.schema";
import { aggregate_user_tipsCreateOneSchema } from "../schemas/createOneaggregate_user_tips.schema";
import { aggregate_user_tipsDeleteManySchema } from "../schemas/deleteManyaggregate_user_tips.schema";
import { aggregate_user_tipsDeleteOneSchema } from "../schemas/deleteOneaggregate_user_tips.schema";
import { aggregate_user_tipsFindFirstSchema } from "../schemas/findFirstaggregate_user_tips.schema";
import { aggregate_user_tipsFindManySchema } from "../schemas/findManyaggregate_user_tips.schema";
import { aggregate_user_tipsFindUniqueSchema } from "../schemas/findUniqueaggregate_user_tips.schema";
import { aggregate_user_tipsGroupBySchema } from "../schemas/groupByaggregate_user_tips.schema";
import { aggregate_user_tipsUpdateManySchema } from "../schemas/updateManyaggregate_user_tips.schema";
import { aggregate_user_tipsUpdateOneSchema } from "../schemas/updateOneaggregate_user_tips.schema";
import { aggregate_user_tipsUpsertSchema } from "../schemas/upsertOneaggregate_user_tips.schema";

export const aggregate_user_tipsRouter = t.router({
  aggregateaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaggregate_user_tips = await ctx.prisma.aggregate_user_tips.aggregate(input);
      return aggregateaggregate_user_tips;
    }),
  createManyaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaggregate_user_tips = await ctx.prisma.aggregate_user_tips.createMany(input);
      return createManyaggregate_user_tips;
    }),
  createOneaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaggregate_user_tips = await ctx.prisma.aggregate_user_tips.create(input);
      return createOneaggregate_user_tips;
    }),
  deleteManyaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaggregate_user_tips = await ctx.prisma.aggregate_user_tips.deleteMany(input);
      return deleteManyaggregate_user_tips;
    }),
  deleteOneaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaggregate_user_tips = await ctx.prisma.aggregate_user_tips.delete(input);
      return deleteOneaggregate_user_tips;
    }),
  findFirstaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_user_tips = await ctx.prisma.aggregate_user_tips.findFirst(input);
      return findFirstaggregate_user_tips;
    }),
  findFirstaggregate_user_tipsOrThrow: publicProcedure
    .input(aggregate_user_tipsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_user_tipsOrThrow = await ctx.prisma.aggregate_user_tips.findFirstOrThrow(input);
      return findFirstaggregate_user_tipsOrThrow;
    }),
  findManyaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsFindManySchema).query(async ({ ctx, input }) => {
      const findManyaggregate_user_tips = await ctx.prisma.aggregate_user_tips.findMany(input);
      return findManyaggregate_user_tips;
    }),
  findUniqueaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_user_tips = await ctx.prisma.aggregate_user_tips.findUnique(input);
      return findUniqueaggregate_user_tips;
    }),
  findUniqueaggregate_user_tipsOrThrow: publicProcedure
    .input(aggregate_user_tipsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_user_tipsOrThrow = await ctx.prisma.aggregate_user_tips.findUniqueOrThrow(input);
      return findUniqueaggregate_user_tipsOrThrow;
    }),
  groupByaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaggregate_user_tips = await ctx.prisma.aggregate_user_tips.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaggregate_user_tips;
    }),
  updateManyaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaggregate_user_tips = await ctx.prisma.aggregate_user_tips.updateMany(input);
      return updateManyaggregate_user_tips;
    }),
  updateOneaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaggregate_user_tips = await ctx.prisma.aggregate_user_tips.update(input);
      return updateOneaggregate_user_tips;
    }),
  upsertOneaggregate_user_tips: publicProcedure
    .input(aggregate_user_tipsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaggregate_user_tips = await ctx.prisma.aggregate_user_tips.upsert(input);
      return upsertOneaggregate_user_tips;
    }),

}) 
