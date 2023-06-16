import { t, publicProcedure } from "./helpers/createRouter";
import { user_tipsAggregateSchema } from "../schemas/aggregateuser_tips.schema";
import { user_tipsCreateManySchema } from "../schemas/createManyuser_tips.schema";
import { user_tipsCreateOneSchema } from "../schemas/createOneuser_tips.schema";
import { user_tipsDeleteManySchema } from "../schemas/deleteManyuser_tips.schema";
import { user_tipsDeleteOneSchema } from "../schemas/deleteOneuser_tips.schema";
import { user_tipsFindFirstSchema } from "../schemas/findFirstuser_tips.schema";
import { user_tipsFindManySchema } from "../schemas/findManyuser_tips.schema";
import { user_tipsFindUniqueSchema } from "../schemas/findUniqueuser_tips.schema";
import { user_tipsGroupBySchema } from "../schemas/groupByuser_tips.schema";
import { user_tipsUpdateManySchema } from "../schemas/updateManyuser_tips.schema";
import { user_tipsUpdateOneSchema } from "../schemas/updateOneuser_tips.schema";
import { user_tipsUpsertSchema } from "../schemas/upsertOneuser_tips.schema";

export const user_tipsRouter = t.router({
  aggregateuser_tips: publicProcedure
    .input(user_tipsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_tips = await ctx.prisma.user_tips.aggregate(input);
      return aggregateuser_tips;
    }),
  createManyuser_tips: publicProcedure
    .input(user_tipsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_tips = await ctx.prisma.user_tips.createMany(input);
      return createManyuser_tips;
    }),
  createOneuser_tips: publicProcedure
    .input(user_tipsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_tips = await ctx.prisma.user_tips.create(input);
      return createOneuser_tips;
    }),
  deleteManyuser_tips: publicProcedure
    .input(user_tipsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_tips = await ctx.prisma.user_tips.deleteMany(input);
      return deleteManyuser_tips;
    }),
  deleteOneuser_tips: publicProcedure
    .input(user_tipsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_tips = await ctx.prisma.user_tips.delete(input);
      return deleteOneuser_tips;
    }),
  findFirstuser_tips: publicProcedure
    .input(user_tipsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_tips = await ctx.prisma.user_tips.findFirst(input);
      return findFirstuser_tips;
    }),
  findFirstuser_tipsOrThrow: publicProcedure
    .input(user_tipsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_tipsOrThrow = await ctx.prisma.user_tips.findFirstOrThrow(input);
      return findFirstuser_tipsOrThrow;
    }),
  findManyuser_tips: publicProcedure
    .input(user_tipsFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_tips = await ctx.prisma.user_tips.findMany(input);
      return findManyuser_tips;
    }),
  findUniqueuser_tips: publicProcedure
    .input(user_tipsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_tips = await ctx.prisma.user_tips.findUnique(input);
      return findUniqueuser_tips;
    }),
  findUniqueuser_tipsOrThrow: publicProcedure
    .input(user_tipsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_tipsOrThrow = await ctx.prisma.user_tips.findUniqueOrThrow(input);
      return findUniqueuser_tipsOrThrow;
    }),
  groupByuser_tips: publicProcedure
    .input(user_tipsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_tips = await ctx.prisma.user_tips.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_tips;
    }),
  updateManyuser_tips: publicProcedure
    .input(user_tipsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_tips = await ctx.prisma.user_tips.updateMany(input);
      return updateManyuser_tips;
    }),
  updateOneuser_tips: publicProcedure
    .input(user_tipsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_tips = await ctx.prisma.user_tips.update(input);
      return updateOneuser_tips;
    }),
  upsertOneuser_tips: publicProcedure
    .input(user_tipsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_tips = await ctx.prisma.user_tips.upsert(input);
      return upsertOneuser_tips;
    }),

}) 
