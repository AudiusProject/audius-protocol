import { t, publicProcedure } from "./helpers/createRouter";
import { subscriptionsAggregateSchema } from "../schemas/aggregatesubscriptions.schema";
import { subscriptionsCreateManySchema } from "../schemas/createManysubscriptions.schema";
import { subscriptionsCreateOneSchema } from "../schemas/createOnesubscriptions.schema";
import { subscriptionsDeleteManySchema } from "../schemas/deleteManysubscriptions.schema";
import { subscriptionsDeleteOneSchema } from "../schemas/deleteOnesubscriptions.schema";
import { subscriptionsFindFirstSchema } from "../schemas/findFirstsubscriptions.schema";
import { subscriptionsFindManySchema } from "../schemas/findManysubscriptions.schema";
import { subscriptionsFindUniqueSchema } from "../schemas/findUniquesubscriptions.schema";
import { subscriptionsGroupBySchema } from "../schemas/groupBysubscriptions.schema";
import { subscriptionsUpdateManySchema } from "../schemas/updateManysubscriptions.schema";
import { subscriptionsUpdateOneSchema } from "../schemas/updateOnesubscriptions.schema";
import { subscriptionsUpsertSchema } from "../schemas/upsertOnesubscriptions.schema";

export const subscriptionsRouter = t.router({
  aggregatesubscriptions: publicProcedure
    .input(subscriptionsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatesubscriptions = await ctx.prisma.subscriptions.aggregate(input);
      return aggregatesubscriptions;
    }),
  createManysubscriptions: publicProcedure
    .input(subscriptionsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManysubscriptions = await ctx.prisma.subscriptions.createMany(input);
      return createManysubscriptions;
    }),
  createOnesubscriptions: publicProcedure
    .input(subscriptionsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnesubscriptions = await ctx.prisma.subscriptions.create(input);
      return createOnesubscriptions;
    }),
  deleteManysubscriptions: publicProcedure
    .input(subscriptionsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManysubscriptions = await ctx.prisma.subscriptions.deleteMany(input);
      return deleteManysubscriptions;
    }),
  deleteOnesubscriptions: publicProcedure
    .input(subscriptionsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnesubscriptions = await ctx.prisma.subscriptions.delete(input);
      return deleteOnesubscriptions;
    }),
  findFirstsubscriptions: publicProcedure
    .input(subscriptionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstsubscriptions = await ctx.prisma.subscriptions.findFirst(input);
      return findFirstsubscriptions;
    }),
  findFirstsubscriptionsOrThrow: publicProcedure
    .input(subscriptionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstsubscriptionsOrThrow = await ctx.prisma.subscriptions.findFirstOrThrow(input);
      return findFirstsubscriptionsOrThrow;
    }),
  findManysubscriptions: publicProcedure
    .input(subscriptionsFindManySchema).query(async ({ ctx, input }) => {
      const findManysubscriptions = await ctx.prisma.subscriptions.findMany(input);
      return findManysubscriptions;
    }),
  findUniquesubscriptions: publicProcedure
    .input(subscriptionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquesubscriptions = await ctx.prisma.subscriptions.findUnique(input);
      return findUniquesubscriptions;
    }),
  findUniquesubscriptionsOrThrow: publicProcedure
    .input(subscriptionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquesubscriptionsOrThrow = await ctx.prisma.subscriptions.findUniqueOrThrow(input);
      return findUniquesubscriptionsOrThrow;
    }),
  groupBysubscriptions: publicProcedure
    .input(subscriptionsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBysubscriptions = await ctx.prisma.subscriptions.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBysubscriptions;
    }),
  updateManysubscriptions: publicProcedure
    .input(subscriptionsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManysubscriptions = await ctx.prisma.subscriptions.updateMany(input);
      return updateManysubscriptions;
    }),
  updateOnesubscriptions: publicProcedure
    .input(subscriptionsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnesubscriptions = await ctx.prisma.subscriptions.update(input);
      return updateOnesubscriptions;
    }),
  upsertOnesubscriptions: publicProcedure
    .input(subscriptionsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnesubscriptions = await ctx.prisma.subscriptions.upsert(input);
      return upsertOnesubscriptions;
    }),

}) 
