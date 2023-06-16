import { t, publicProcedure } from "./helpers/createRouter";
import { playlist_seenAggregateSchema } from "../schemas/aggregateplaylist_seen.schema";
import { playlist_seenCreateManySchema } from "../schemas/createManyplaylist_seen.schema";
import { playlist_seenCreateOneSchema } from "../schemas/createOneplaylist_seen.schema";
import { playlist_seenDeleteManySchema } from "../schemas/deleteManyplaylist_seen.schema";
import { playlist_seenDeleteOneSchema } from "../schemas/deleteOneplaylist_seen.schema";
import { playlist_seenFindFirstSchema } from "../schemas/findFirstplaylist_seen.schema";
import { playlist_seenFindManySchema } from "../schemas/findManyplaylist_seen.schema";
import { playlist_seenFindUniqueSchema } from "../schemas/findUniqueplaylist_seen.schema";
import { playlist_seenGroupBySchema } from "../schemas/groupByplaylist_seen.schema";
import { playlist_seenUpdateManySchema } from "../schemas/updateManyplaylist_seen.schema";
import { playlist_seenUpdateOneSchema } from "../schemas/updateOneplaylist_seen.schema";
import { playlist_seenUpsertSchema } from "../schemas/upsertOneplaylist_seen.schema";

export const playlist_seensRouter = t.router({
  aggregateplaylist_seen: publicProcedure
    .input(playlist_seenAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateplaylist_seen = await ctx.prisma.playlist_seen.aggregate(input);
      return aggregateplaylist_seen;
    }),
  createManyplaylist_seen: publicProcedure
    .input(playlist_seenCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyplaylist_seen = await ctx.prisma.playlist_seen.createMany(input);
      return createManyplaylist_seen;
    }),
  createOneplaylist_seen: publicProcedure
    .input(playlist_seenCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneplaylist_seen = await ctx.prisma.playlist_seen.create(input);
      return createOneplaylist_seen;
    }),
  deleteManyplaylist_seen: publicProcedure
    .input(playlist_seenDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyplaylist_seen = await ctx.prisma.playlist_seen.deleteMany(input);
      return deleteManyplaylist_seen;
    }),
  deleteOneplaylist_seen: publicProcedure
    .input(playlist_seenDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneplaylist_seen = await ctx.prisma.playlist_seen.delete(input);
      return deleteOneplaylist_seen;
    }),
  findFirstplaylist_seen: publicProcedure
    .input(playlist_seenFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstplaylist_seen = await ctx.prisma.playlist_seen.findFirst(input);
      return findFirstplaylist_seen;
    }),
  findFirstplaylist_seenOrThrow: publicProcedure
    .input(playlist_seenFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstplaylist_seenOrThrow = await ctx.prisma.playlist_seen.findFirstOrThrow(input);
      return findFirstplaylist_seenOrThrow;
    }),
  findManyplaylist_seen: publicProcedure
    .input(playlist_seenFindManySchema).query(async ({ ctx, input }) => {
      const findManyplaylist_seen = await ctx.prisma.playlist_seen.findMany(input);
      return findManyplaylist_seen;
    }),
  findUniqueplaylist_seen: publicProcedure
    .input(playlist_seenFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueplaylist_seen = await ctx.prisma.playlist_seen.findUnique(input);
      return findUniqueplaylist_seen;
    }),
  findUniqueplaylist_seenOrThrow: publicProcedure
    .input(playlist_seenFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueplaylist_seenOrThrow = await ctx.prisma.playlist_seen.findUniqueOrThrow(input);
      return findUniqueplaylist_seenOrThrow;
    }),
  groupByplaylist_seen: publicProcedure
    .input(playlist_seenGroupBySchema).query(async ({ ctx, input }) => {
      const groupByplaylist_seen = await ctx.prisma.playlist_seen.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByplaylist_seen;
    }),
  updateManyplaylist_seen: publicProcedure
    .input(playlist_seenUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyplaylist_seen = await ctx.prisma.playlist_seen.updateMany(input);
      return updateManyplaylist_seen;
    }),
  updateOneplaylist_seen: publicProcedure
    .input(playlist_seenUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneplaylist_seen = await ctx.prisma.playlist_seen.update(input);
      return updateOneplaylist_seen;
    }),
  upsertOneplaylist_seen: publicProcedure
    .input(playlist_seenUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneplaylist_seen = await ctx.prisma.playlist_seen.upsert(input);
      return upsertOneplaylist_seen;
    }),

}) 
