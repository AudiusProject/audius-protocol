import { t, publicProcedure } from "./helpers/createRouter";
import { aggregate_playlistAggregateSchema } from "../schemas/aggregateaggregate_playlist.schema";
import { aggregate_playlistCreateManySchema } from "../schemas/createManyaggregate_playlist.schema";
import { aggregate_playlistCreateOneSchema } from "../schemas/createOneaggregate_playlist.schema";
import { aggregate_playlistDeleteManySchema } from "../schemas/deleteManyaggregate_playlist.schema";
import { aggregate_playlistDeleteOneSchema } from "../schemas/deleteOneaggregate_playlist.schema";
import { aggregate_playlistFindFirstSchema } from "../schemas/findFirstaggregate_playlist.schema";
import { aggregate_playlistFindManySchema } from "../schemas/findManyaggregate_playlist.schema";
import { aggregate_playlistFindUniqueSchema } from "../schemas/findUniqueaggregate_playlist.schema";
import { aggregate_playlistGroupBySchema } from "../schemas/groupByaggregate_playlist.schema";
import { aggregate_playlistUpdateManySchema } from "../schemas/updateManyaggregate_playlist.schema";
import { aggregate_playlistUpdateOneSchema } from "../schemas/updateOneaggregate_playlist.schema";
import { aggregate_playlistUpsertSchema } from "../schemas/upsertOneaggregate_playlist.schema";

export const aggregate_playlistsRouter = t.router({
  aggregateaggregate_playlist: publicProcedure
    .input(aggregate_playlistAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaggregate_playlist = await ctx.prisma.aggregate_playlist.aggregate(input);
      return aggregateaggregate_playlist;
    }),
  createManyaggregate_playlist: publicProcedure
    .input(aggregate_playlistCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaggregate_playlist = await ctx.prisma.aggregate_playlist.createMany(input);
      return createManyaggregate_playlist;
    }),
  createOneaggregate_playlist: publicProcedure
    .input(aggregate_playlistCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaggregate_playlist = await ctx.prisma.aggregate_playlist.create(input);
      return createOneaggregate_playlist;
    }),
  deleteManyaggregate_playlist: publicProcedure
    .input(aggregate_playlistDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaggregate_playlist = await ctx.prisma.aggregate_playlist.deleteMany(input);
      return deleteManyaggregate_playlist;
    }),
  deleteOneaggregate_playlist: publicProcedure
    .input(aggregate_playlistDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaggregate_playlist = await ctx.prisma.aggregate_playlist.delete(input);
      return deleteOneaggregate_playlist;
    }),
  findFirstaggregate_playlist: publicProcedure
    .input(aggregate_playlistFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_playlist = await ctx.prisma.aggregate_playlist.findFirst(input);
      return findFirstaggregate_playlist;
    }),
  findFirstaggregate_playlistOrThrow: publicProcedure
    .input(aggregate_playlistFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_playlistOrThrow = await ctx.prisma.aggregate_playlist.findFirstOrThrow(input);
      return findFirstaggregate_playlistOrThrow;
    }),
  findManyaggregate_playlist: publicProcedure
    .input(aggregate_playlistFindManySchema).query(async ({ ctx, input }) => {
      const findManyaggregate_playlist = await ctx.prisma.aggregate_playlist.findMany(input);
      return findManyaggregate_playlist;
    }),
  findUniqueaggregate_playlist: publicProcedure
    .input(aggregate_playlistFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_playlist = await ctx.prisma.aggregate_playlist.findUnique(input);
      return findUniqueaggregate_playlist;
    }),
  findUniqueaggregate_playlistOrThrow: publicProcedure
    .input(aggregate_playlistFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_playlistOrThrow = await ctx.prisma.aggregate_playlist.findUniqueOrThrow(input);
      return findUniqueaggregate_playlistOrThrow;
    }),
  groupByaggregate_playlist: publicProcedure
    .input(aggregate_playlistGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaggregate_playlist = await ctx.prisma.aggregate_playlist.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaggregate_playlist;
    }),
  updateManyaggregate_playlist: publicProcedure
    .input(aggregate_playlistUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaggregate_playlist = await ctx.prisma.aggregate_playlist.updateMany(input);
      return updateManyaggregate_playlist;
    }),
  updateOneaggregate_playlist: publicProcedure
    .input(aggregate_playlistUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaggregate_playlist = await ctx.prisma.aggregate_playlist.update(input);
      return updateOneaggregate_playlist;
    }),
  upsertOneaggregate_playlist: publicProcedure
    .input(aggregate_playlistUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaggregate_playlist = await ctx.prisma.aggregate_playlist.upsert(input);
      return upsertOneaggregate_playlist;
    }),

}) 
