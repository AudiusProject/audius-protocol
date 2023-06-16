import { t, publicProcedure } from "./helpers/createRouter";
import { audio_transactions_historyAggregateSchema } from "../schemas/aggregateaudio_transactions_history.schema";
import { audio_transactions_historyCreateManySchema } from "../schemas/createManyaudio_transactions_history.schema";
import { audio_transactions_historyCreateOneSchema } from "../schemas/createOneaudio_transactions_history.schema";
import { audio_transactions_historyDeleteManySchema } from "../schemas/deleteManyaudio_transactions_history.schema";
import { audio_transactions_historyDeleteOneSchema } from "../schemas/deleteOneaudio_transactions_history.schema";
import { audio_transactions_historyFindFirstSchema } from "../schemas/findFirstaudio_transactions_history.schema";
import { audio_transactions_historyFindManySchema } from "../schemas/findManyaudio_transactions_history.schema";
import { audio_transactions_historyFindUniqueSchema } from "../schemas/findUniqueaudio_transactions_history.schema";
import { audio_transactions_historyGroupBySchema } from "../schemas/groupByaudio_transactions_history.schema";
import { audio_transactions_historyUpdateManySchema } from "../schemas/updateManyaudio_transactions_history.schema";
import { audio_transactions_historyUpdateOneSchema } from "../schemas/updateOneaudio_transactions_history.schema";
import { audio_transactions_historyUpsertSchema } from "../schemas/upsertOneaudio_transactions_history.schema";

export const audio_transactions_historiesRouter = t.router({
  aggregateaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaudio_transactions_history = await ctx.prisma.audio_transactions_history.aggregate(input);
      return aggregateaudio_transactions_history;
    }),
  createManyaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaudio_transactions_history = await ctx.prisma.audio_transactions_history.createMany(input);
      return createManyaudio_transactions_history;
    }),
  createOneaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaudio_transactions_history = await ctx.prisma.audio_transactions_history.create(input);
      return createOneaudio_transactions_history;
    }),
  deleteManyaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaudio_transactions_history = await ctx.prisma.audio_transactions_history.deleteMany(input);
      return deleteManyaudio_transactions_history;
    }),
  deleteOneaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaudio_transactions_history = await ctx.prisma.audio_transactions_history.delete(input);
      return deleteOneaudio_transactions_history;
    }),
  findFirstaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaudio_transactions_history = await ctx.prisma.audio_transactions_history.findFirst(input);
      return findFirstaudio_transactions_history;
    }),
  findFirstaudio_transactions_historyOrThrow: publicProcedure
    .input(audio_transactions_historyFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaudio_transactions_historyOrThrow = await ctx.prisma.audio_transactions_history.findFirstOrThrow(input);
      return findFirstaudio_transactions_historyOrThrow;
    }),
  findManyaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyFindManySchema).query(async ({ ctx, input }) => {
      const findManyaudio_transactions_history = await ctx.prisma.audio_transactions_history.findMany(input);
      return findManyaudio_transactions_history;
    }),
  findUniqueaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaudio_transactions_history = await ctx.prisma.audio_transactions_history.findUnique(input);
      return findUniqueaudio_transactions_history;
    }),
  findUniqueaudio_transactions_historyOrThrow: publicProcedure
    .input(audio_transactions_historyFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaudio_transactions_historyOrThrow = await ctx.prisma.audio_transactions_history.findUniqueOrThrow(input);
      return findUniqueaudio_transactions_historyOrThrow;
    }),
  groupByaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaudio_transactions_history = await ctx.prisma.audio_transactions_history.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaudio_transactions_history;
    }),
  updateManyaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaudio_transactions_history = await ctx.prisma.audio_transactions_history.updateMany(input);
      return updateManyaudio_transactions_history;
    }),
  updateOneaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaudio_transactions_history = await ctx.prisma.audio_transactions_history.update(input);
      return updateOneaudio_transactions_history;
    }),
  upsertOneaudio_transactions_history: publicProcedure
    .input(audio_transactions_historyUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaudio_transactions_history = await ctx.prisma.audio_transactions_history.upsert(input);
      return upsertOneaudio_transactions_history;
    }),

}) 
