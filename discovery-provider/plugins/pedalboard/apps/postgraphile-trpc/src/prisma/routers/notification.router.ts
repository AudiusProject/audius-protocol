import { t, publicProcedure } from "./helpers/createRouter";
import { notificationAggregateSchema } from "../schemas/aggregatenotification.schema";
import { notificationCreateManySchema } from "../schemas/createManynotification.schema";
import { notificationCreateOneSchema } from "../schemas/createOnenotification.schema";
import { notificationDeleteManySchema } from "../schemas/deleteManynotification.schema";
import { notificationDeleteOneSchema } from "../schemas/deleteOnenotification.schema";
import { notificationFindFirstSchema } from "../schemas/findFirstnotification.schema";
import { notificationFindManySchema } from "../schemas/findManynotification.schema";
import { notificationFindUniqueSchema } from "../schemas/findUniquenotification.schema";
import { notificationGroupBySchema } from "../schemas/groupBynotification.schema";
import { notificationUpdateManySchema } from "../schemas/updateManynotification.schema";
import { notificationUpdateOneSchema } from "../schemas/updateOnenotification.schema";
import { notificationUpsertSchema } from "../schemas/upsertOnenotification.schema";

export const notificationsRouter = t.router({
  aggregatenotification: publicProcedure
    .input(notificationAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatenotification = await ctx.prisma.notification.aggregate(input);
      return aggregatenotification;
    }),
  createManynotification: publicProcedure
    .input(notificationCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManynotification = await ctx.prisma.notification.createMany(input);
      return createManynotification;
    }),
  createOnenotification: publicProcedure
    .input(notificationCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnenotification = await ctx.prisma.notification.create(input);
      return createOnenotification;
    }),
  deleteManynotification: publicProcedure
    .input(notificationDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManynotification = await ctx.prisma.notification.deleteMany(input);
      return deleteManynotification;
    }),
  deleteOnenotification: publicProcedure
    .input(notificationDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnenotification = await ctx.prisma.notification.delete(input);
      return deleteOnenotification;
    }),
  findFirstnotification: publicProcedure
    .input(notificationFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstnotification = await ctx.prisma.notification.findFirst(input);
      return findFirstnotification;
    }),
  findFirstnotificationOrThrow: publicProcedure
    .input(notificationFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstnotificationOrThrow = await ctx.prisma.notification.findFirstOrThrow(input);
      return findFirstnotificationOrThrow;
    }),
  findManynotification: publicProcedure
    .input(notificationFindManySchema).query(async ({ ctx, input }) => {
      const findManynotification = await ctx.prisma.notification.findMany(input);
      return findManynotification;
    }),
  findUniquenotification: publicProcedure
    .input(notificationFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquenotification = await ctx.prisma.notification.findUnique(input);
      return findUniquenotification;
    }),
  findUniquenotificationOrThrow: publicProcedure
    .input(notificationFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquenotificationOrThrow = await ctx.prisma.notification.findUniqueOrThrow(input);
      return findUniquenotificationOrThrow;
    }),
  groupBynotification: publicProcedure
    .input(notificationGroupBySchema).query(async ({ ctx, input }) => {
      const groupBynotification = await ctx.prisma.notification.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBynotification;
    }),
  updateManynotification: publicProcedure
    .input(notificationUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManynotification = await ctx.prisma.notification.updateMany(input);
      return updateManynotification;
    }),
  updateOnenotification: publicProcedure
    .input(notificationUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnenotification = await ctx.prisma.notification.update(input);
      return updateOnenotification;
    }),
  upsertOnenotification: publicProcedure
    .input(notificationUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnenotification = await ctx.prisma.notification.upsert(input);
      return upsertOnenotification;
    }),

}) 
