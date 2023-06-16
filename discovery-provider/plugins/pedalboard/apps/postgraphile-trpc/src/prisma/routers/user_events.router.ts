import { t, publicProcedure } from "./helpers/createRouter";
import { user_eventsAggregateSchema } from "../schemas/aggregateuser_events.schema";
import { user_eventsCreateManySchema } from "../schemas/createManyuser_events.schema";
import { user_eventsCreateOneSchema } from "../schemas/createOneuser_events.schema";
import { user_eventsDeleteManySchema } from "../schemas/deleteManyuser_events.schema";
import { user_eventsDeleteOneSchema } from "../schemas/deleteOneuser_events.schema";
import { user_eventsFindFirstSchema } from "../schemas/findFirstuser_events.schema";
import { user_eventsFindManySchema } from "../schemas/findManyuser_events.schema";
import { user_eventsFindUniqueSchema } from "../schemas/findUniqueuser_events.schema";
import { user_eventsGroupBySchema } from "../schemas/groupByuser_events.schema";
import { user_eventsUpdateManySchema } from "../schemas/updateManyuser_events.schema";
import { user_eventsUpdateOneSchema } from "../schemas/updateOneuser_events.schema";
import { user_eventsUpsertSchema } from "../schemas/upsertOneuser_events.schema";

export const user_eventsRouter = t.router({
  aggregateuser_events: publicProcedure
    .input(user_eventsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_events = await ctx.prisma.user_events.aggregate(input);
      return aggregateuser_events;
    }),
  createManyuser_events: publicProcedure
    .input(user_eventsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_events = await ctx.prisma.user_events.createMany(input);
      return createManyuser_events;
    }),
  createOneuser_events: publicProcedure
    .input(user_eventsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_events = await ctx.prisma.user_events.create(input);
      return createOneuser_events;
    }),
  deleteManyuser_events: publicProcedure
    .input(user_eventsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_events = await ctx.prisma.user_events.deleteMany(input);
      return deleteManyuser_events;
    }),
  deleteOneuser_events: publicProcedure
    .input(user_eventsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_events = await ctx.prisma.user_events.delete(input);
      return deleteOneuser_events;
    }),
  findFirstuser_events: publicProcedure
    .input(user_eventsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_events = await ctx.prisma.user_events.findFirst(input);
      return findFirstuser_events;
    }),
  findFirstuser_eventsOrThrow: publicProcedure
    .input(user_eventsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_eventsOrThrow = await ctx.prisma.user_events.findFirstOrThrow(input);
      return findFirstuser_eventsOrThrow;
    }),
  findManyuser_events: publicProcedure
    .input(user_eventsFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_events = await ctx.prisma.user_events.findMany(input);
      return findManyuser_events;
    }),
  findUniqueuser_events: publicProcedure
    .input(user_eventsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_events = await ctx.prisma.user_events.findUnique(input);
      return findUniqueuser_events;
    }),
  findUniqueuser_eventsOrThrow: publicProcedure
    .input(user_eventsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_eventsOrThrow = await ctx.prisma.user_events.findUniqueOrThrow(input);
      return findUniqueuser_eventsOrThrow;
    }),
  groupByuser_events: publicProcedure
    .input(user_eventsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_events = await ctx.prisma.user_events.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_events;
    }),
  updateManyuser_events: publicProcedure
    .input(user_eventsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_events = await ctx.prisma.user_events.updateMany(input);
      return updateManyuser_events;
    }),
  updateOneuser_events: publicProcedure
    .input(user_eventsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_events = await ctx.prisma.user_events.update(input);
      return updateOneuser_events;
    }),
  upsertOneuser_events: publicProcedure
    .input(user_eventsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_events = await ctx.prisma.user_events.upsert(input);
      return upsertOneuser_events;
    }),

}) 
