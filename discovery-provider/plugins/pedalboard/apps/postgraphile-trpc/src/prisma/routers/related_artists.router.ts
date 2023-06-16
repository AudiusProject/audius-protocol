import { t, publicProcedure } from "./helpers/createRouter";
import { related_artistsAggregateSchema } from "../schemas/aggregaterelated_artists.schema";
import { related_artistsCreateManySchema } from "../schemas/createManyrelated_artists.schema";
import { related_artistsCreateOneSchema } from "../schemas/createOnerelated_artists.schema";
import { related_artistsDeleteManySchema } from "../schemas/deleteManyrelated_artists.schema";
import { related_artistsDeleteOneSchema } from "../schemas/deleteOnerelated_artists.schema";
import { related_artistsFindFirstSchema } from "../schemas/findFirstrelated_artists.schema";
import { related_artistsFindManySchema } from "../schemas/findManyrelated_artists.schema";
import { related_artistsFindUniqueSchema } from "../schemas/findUniquerelated_artists.schema";
import { related_artistsGroupBySchema } from "../schemas/groupByrelated_artists.schema";
import { related_artistsUpdateManySchema } from "../schemas/updateManyrelated_artists.schema";
import { related_artistsUpdateOneSchema } from "../schemas/updateOnerelated_artists.schema";
import { related_artistsUpsertSchema } from "../schemas/upsertOnerelated_artists.schema";

export const related_artistsRouter = t.router({
  aggregaterelated_artists: publicProcedure
    .input(related_artistsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregaterelated_artists = await ctx.prisma.related_artists.aggregate(input);
      return aggregaterelated_artists;
    }),
  createManyrelated_artists: publicProcedure
    .input(related_artistsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyrelated_artists = await ctx.prisma.related_artists.createMany(input);
      return createManyrelated_artists;
    }),
  createOnerelated_artists: publicProcedure
    .input(related_artistsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnerelated_artists = await ctx.prisma.related_artists.create(input);
      return createOnerelated_artists;
    }),
  deleteManyrelated_artists: publicProcedure
    .input(related_artistsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyrelated_artists = await ctx.prisma.related_artists.deleteMany(input);
      return deleteManyrelated_artists;
    }),
  deleteOnerelated_artists: publicProcedure
    .input(related_artistsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnerelated_artists = await ctx.prisma.related_artists.delete(input);
      return deleteOnerelated_artists;
    }),
  findFirstrelated_artists: publicProcedure
    .input(related_artistsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrelated_artists = await ctx.prisma.related_artists.findFirst(input);
      return findFirstrelated_artists;
    }),
  findFirstrelated_artistsOrThrow: publicProcedure
    .input(related_artistsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstrelated_artistsOrThrow = await ctx.prisma.related_artists.findFirstOrThrow(input);
      return findFirstrelated_artistsOrThrow;
    }),
  findManyrelated_artists: publicProcedure
    .input(related_artistsFindManySchema).query(async ({ ctx, input }) => {
      const findManyrelated_artists = await ctx.prisma.related_artists.findMany(input);
      return findManyrelated_artists;
    }),
  findUniquerelated_artists: publicProcedure
    .input(related_artistsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerelated_artists = await ctx.prisma.related_artists.findUnique(input);
      return findUniquerelated_artists;
    }),
  findUniquerelated_artistsOrThrow: publicProcedure
    .input(related_artistsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquerelated_artistsOrThrow = await ctx.prisma.related_artists.findUniqueOrThrow(input);
      return findUniquerelated_artistsOrThrow;
    }),
  groupByrelated_artists: publicProcedure
    .input(related_artistsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByrelated_artists = await ctx.prisma.related_artists.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByrelated_artists;
    }),
  updateManyrelated_artists: publicProcedure
    .input(related_artistsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyrelated_artists = await ctx.prisma.related_artists.updateMany(input);
      return updateManyrelated_artists;
    }),
  updateOnerelated_artists: publicProcedure
    .input(related_artistsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnerelated_artists = await ctx.prisma.related_artists.update(input);
      return updateOnerelated_artists;
    }),
  upsertOnerelated_artists: publicProcedure
    .input(related_artistsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnerelated_artists = await ctx.prisma.related_artists.upsert(input);
      return upsertOnerelated_artists;
    }),

}) 
