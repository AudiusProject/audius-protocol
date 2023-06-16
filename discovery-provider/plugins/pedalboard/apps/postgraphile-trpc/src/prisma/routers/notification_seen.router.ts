import { t, publicProcedure } from "./helpers/createRouter";
import { notification_seenAggregateSchema } from "../schemas/aggregatenotification_seen.schema";
import { notification_seenCreateManySchema } from "../schemas/createManynotification_seen.schema";
import { notification_seenCreateOneSchema } from "../schemas/createOnenotification_seen.schema";
import { notification_seenDeleteManySchema } from "../schemas/deleteManynotification_seen.schema";
import { notification_seenDeleteOneSchema } from "../schemas/deleteOnenotification_seen.schema";
import { notification_seenFindFirstSchema } from "../schemas/findFirstnotification_seen.schema";
import { notification_seenFindManySchema } from "../schemas/findManynotification_seen.schema";
import { notification_seenFindUniqueSchema } from "../schemas/findUniquenotification_seen.schema";
import { notification_seenGroupBySchema } from "../schemas/groupBynotification_seen.schema";
import { notification_seenUpdateManySchema } from "../schemas/updateManynotification_seen.schema";
import { notification_seenUpdateOneSchema } from "../schemas/updateOnenotification_seen.schema";
import { notification_seenUpsertSchema } from "../schemas/upsertOnenotification_seen.schema";

export const notification_seensRouter = t.router({
  aggregatenotification_seen: publicProcedure
    .input(notification_seenAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatenotification_seen = await ctx.prisma.notification_seen.aggregate(input);
      return aggregatenotification_seen;
    }),
  createManynotification_seen: publicProcedure
    .input(notification_seenCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManynotification_seen = await ctx.prisma.notification_seen.createMany(input);
      return createManynotification_seen;
    }),
  createOnenotification_seen: publicProcedure
    .input(notification_seenCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnenotification_seen = await ctx.prisma.notification_seen.create(input);
      return createOnenotification_seen;
    }),
  deleteManynotification_seen: publicProcedure
    .input(notification_seenDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManynotification_seen = await ctx.prisma.notification_seen.deleteMany(input);
      return deleteManynotification_seen;
    }),
  deleteOnenotification_seen: publicProcedure
    .input(notification_seenDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnenotification_seen = await ctx.prisma.notification_seen.delete(input);
      return deleteOnenotification_seen;
    }),
  findFirstnotification_seen: publicProcedure
    .input(notification_seenFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstnotification_seen = await ctx.prisma.notification_seen.findFirst(input);
      return findFirstnotification_seen;
    }),
  findFirstnotification_seenOrThrow: publicProcedure
    .input(notification_seenFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstnotification_seenOrThrow = await ctx.prisma.notification_seen.findFirstOrThrow(input);
      return findFirstnotification_seenOrThrow;
    }),
  findManynotification_seen: publicProcedure
    .input(notification_seenFindManySchema).query(async ({ ctx, input }) => {
      const findManynotification_seen = await ctx.prisma.notification_seen.findMany(input);
      return findManynotification_seen;
    }),
  findUniquenotification_seen: publicProcedure
    .input(notification_seenFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquenotification_seen = await ctx.prisma.notification_seen.findUnique(input);
      return findUniquenotification_seen;
    }),
  findUniquenotification_seenOrThrow: publicProcedure
    .input(notification_seenFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquenotification_seenOrThrow = await ctx.prisma.notification_seen.findUniqueOrThrow(input);
      return findUniquenotification_seenOrThrow;
    }),
  groupBynotification_seen: publicProcedure
    .input(notification_seenGroupBySchema).query(async ({ ctx, input }) => {
      const groupBynotification_seen = await ctx.prisma.notification_seen.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBynotification_seen;
    }),
  updateManynotification_seen: publicProcedure
    .input(notification_seenUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManynotification_seen = await ctx.prisma.notification_seen.updateMany(input);
      return updateManynotification_seen;
    }),
  updateOnenotification_seen: publicProcedure
    .input(notification_seenUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnenotification_seen = await ctx.prisma.notification_seen.update(input);
      return updateOnenotification_seen;
    }),
  upsertOnenotification_seen: publicProcedure
    .input(notification_seenUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnenotification_seen = await ctx.prisma.notification_seen.upsert(input);
      return upsertOnenotification_seen;
    }),

}) 
