import { t, publicProcedure } from "./helpers/createRouter";
import { playlistsAggregateSchema } from "../schemas/aggregateplaylists.schema";
import { playlistsCreateManySchema } from "../schemas/createManyplaylists.schema";
import { playlistsCreateOneSchema } from "../schemas/createOneplaylists.schema";
import { playlistsDeleteManySchema } from "../schemas/deleteManyplaylists.schema";
import { playlistsDeleteOneSchema } from "../schemas/deleteOneplaylists.schema";
import { playlistsFindFirstSchema } from "../schemas/findFirstplaylists.schema";
import { playlistsFindManySchema } from "../schemas/findManyplaylists.schema";
import { playlistsFindUniqueSchema } from "../schemas/findUniqueplaylists.schema";
import { playlistsGroupBySchema } from "../schemas/groupByplaylists.schema";
import { playlistsUpdateManySchema } from "../schemas/updateManyplaylists.schema";
import { playlistsUpdateOneSchema } from "../schemas/updateOneplaylists.schema";
import { playlistsUpsertSchema } from "../schemas/upsertOneplaylists.schema";

export const playlistsRouter = t.router({
  aggregateplaylists: publicProcedure
    .input(playlistsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateplaylists = await ctx.prisma.playlists.aggregate(input);
      return aggregateplaylists;
    }),
  createManyplaylists: publicProcedure
    .input(playlistsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyplaylists = await ctx.prisma.playlists.createMany(input);
      return createManyplaylists;
    }),
  createOneplaylists: publicProcedure
    .input(playlistsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneplaylists = await ctx.prisma.playlists.create(input);
      return createOneplaylists;
    }),
  deleteManyplaylists: publicProcedure
    .input(playlistsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyplaylists = await ctx.prisma.playlists.deleteMany(input);
      return deleteManyplaylists;
    }),
  deleteOneplaylists: publicProcedure
    .input(playlistsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneplaylists = await ctx.prisma.playlists.delete(input);
      return deleteOneplaylists;
    }),
  findFirstplaylists: publicProcedure
    .input(playlistsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstplaylists = await ctx.prisma.playlists.findFirst(input);
      return findFirstplaylists;
    }),
  findFirstplaylistsOrThrow: publicProcedure
    .input(playlistsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstplaylistsOrThrow = await ctx.prisma.playlists.findFirstOrThrow(input);
      return findFirstplaylistsOrThrow;
    }),
  findManyplaylists: publicProcedure
    .input(playlistsFindManySchema).query(async ({ ctx, input }) => {
      const findManyplaylists = await ctx.prisma.playlists.findMany(input);
      return findManyplaylists;
    }),
  findUniqueplaylists: publicProcedure
    .input(playlistsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueplaylists = await ctx.prisma.playlists.findUnique(input);
      return findUniqueplaylists;
    }),
  findUniqueplaylistsOrThrow: publicProcedure
    .input(playlistsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueplaylistsOrThrow = await ctx.prisma.playlists.findUniqueOrThrow(input);
      return findUniqueplaylistsOrThrow;
    }),
  groupByplaylists: publicProcedure
    .input(playlistsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByplaylists = await ctx.prisma.playlists.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByplaylists;
    }),
  updateManyplaylists: publicProcedure
    .input(playlistsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyplaylists = await ctx.prisma.playlists.updateMany(input);
      return updateManyplaylists;
    }),
  updateOneplaylists: publicProcedure
    .input(playlistsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneplaylists = await ctx.prisma.playlists.update(input);
      return updateOneplaylists;
    }),
  upsertOneplaylists: publicProcedure
    .input(playlistsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneplaylists = await ctx.prisma.playlists.upsert(input);
      return upsertOneplaylists;
    }),

}) 
