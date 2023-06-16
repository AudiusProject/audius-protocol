import { t, publicProcedure } from "./helpers/createRouter";
import { user_listening_historyAggregateSchema } from "../schemas/aggregateuser_listening_history.schema";
import { user_listening_historyCreateManySchema } from "../schemas/createManyuser_listening_history.schema";
import { user_listening_historyCreateOneSchema } from "../schemas/createOneuser_listening_history.schema";
import { user_listening_historyDeleteManySchema } from "../schemas/deleteManyuser_listening_history.schema";
import { user_listening_historyDeleteOneSchema } from "../schemas/deleteOneuser_listening_history.schema";
import { user_listening_historyFindFirstSchema } from "../schemas/findFirstuser_listening_history.schema";
import { user_listening_historyFindManySchema } from "../schemas/findManyuser_listening_history.schema";
import { user_listening_historyFindUniqueSchema } from "../schemas/findUniqueuser_listening_history.schema";
import { user_listening_historyGroupBySchema } from "../schemas/groupByuser_listening_history.schema";
import { user_listening_historyUpdateManySchema } from "../schemas/updateManyuser_listening_history.schema";
import { user_listening_historyUpdateOneSchema } from "../schemas/updateOneuser_listening_history.schema";
import { user_listening_historyUpsertSchema } from "../schemas/upsertOneuser_listening_history.schema";

export const user_listening_historiesRouter = t.router({
  aggregateuser_listening_history: publicProcedure
    .input(user_listening_historyAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_listening_history = await ctx.prisma.user_listening_history.aggregate(input);
      return aggregateuser_listening_history;
    }),
  createManyuser_listening_history: publicProcedure
    .input(user_listening_historyCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_listening_history = await ctx.prisma.user_listening_history.createMany(input);
      return createManyuser_listening_history;
    }),
  createOneuser_listening_history: publicProcedure
    .input(user_listening_historyCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_listening_history = await ctx.prisma.user_listening_history.create(input);
      return createOneuser_listening_history;
    }),
  deleteManyuser_listening_history: publicProcedure
    .input(user_listening_historyDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_listening_history = await ctx.prisma.user_listening_history.deleteMany(input);
      return deleteManyuser_listening_history;
    }),
  deleteOneuser_listening_history: publicProcedure
    .input(user_listening_historyDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_listening_history = await ctx.prisma.user_listening_history.delete(input);
      return deleteOneuser_listening_history;
    }),
  findFirstuser_listening_history: publicProcedure
    .input(user_listening_historyFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_listening_history = await ctx.prisma.user_listening_history.findFirst(input);
      return findFirstuser_listening_history;
    }),
  findFirstuser_listening_historyOrThrow: publicProcedure
    .input(user_listening_historyFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_listening_historyOrThrow = await ctx.prisma.user_listening_history.findFirstOrThrow(input);
      return findFirstuser_listening_historyOrThrow;
    }),
  findManyuser_listening_history: publicProcedure
    .input(user_listening_historyFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_listening_history = await ctx.prisma.user_listening_history.findMany(input);
      return findManyuser_listening_history;
    }),
  findUniqueuser_listening_history: publicProcedure
    .input(user_listening_historyFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_listening_history = await ctx.prisma.user_listening_history.findUnique(input);
      return findUniqueuser_listening_history;
    }),
  findUniqueuser_listening_historyOrThrow: publicProcedure
    .input(user_listening_historyFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_listening_historyOrThrow = await ctx.prisma.user_listening_history.findUniqueOrThrow(input);
      return findUniqueuser_listening_historyOrThrow;
    }),
  groupByuser_listening_history: publicProcedure
    .input(user_listening_historyGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_listening_history = await ctx.prisma.user_listening_history.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_listening_history;
    }),
  updateManyuser_listening_history: publicProcedure
    .input(user_listening_historyUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_listening_history = await ctx.prisma.user_listening_history.updateMany(input);
      return updateManyuser_listening_history;
    }),
  updateOneuser_listening_history: publicProcedure
    .input(user_listening_historyUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_listening_history = await ctx.prisma.user_listening_history.update(input);
      return updateOneuser_listening_history;
    }),
  upsertOneuser_listening_history: publicProcedure
    .input(user_listening_historyUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_listening_history = await ctx.prisma.user_listening_history.upsert(input);
      return upsertOneuser_listening_history;
    }),

}) 
