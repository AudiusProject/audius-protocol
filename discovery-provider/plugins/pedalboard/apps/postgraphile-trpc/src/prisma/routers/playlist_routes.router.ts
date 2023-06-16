import { t, publicProcedure } from "./helpers/createRouter";
import { playlist_routesAggregateSchema } from "../schemas/aggregateplaylist_routes.schema";
import { playlist_routesCreateManySchema } from "../schemas/createManyplaylist_routes.schema";
import { playlist_routesCreateOneSchema } from "../schemas/createOneplaylist_routes.schema";
import { playlist_routesDeleteManySchema } from "../schemas/deleteManyplaylist_routes.schema";
import { playlist_routesDeleteOneSchema } from "../schemas/deleteOneplaylist_routes.schema";
import { playlist_routesFindFirstSchema } from "../schemas/findFirstplaylist_routes.schema";
import { playlist_routesFindManySchema } from "../schemas/findManyplaylist_routes.schema";
import { playlist_routesFindUniqueSchema } from "../schemas/findUniqueplaylist_routes.schema";
import { playlist_routesGroupBySchema } from "../schemas/groupByplaylist_routes.schema";
import { playlist_routesUpdateManySchema } from "../schemas/updateManyplaylist_routes.schema";
import { playlist_routesUpdateOneSchema } from "../schemas/updateOneplaylist_routes.schema";
import { playlist_routesUpsertSchema } from "../schemas/upsertOneplaylist_routes.schema";

export const playlist_routesRouter = t.router({
  aggregateplaylist_routes: publicProcedure
    .input(playlist_routesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateplaylist_routes = await ctx.prisma.playlist_routes.aggregate(input);
      return aggregateplaylist_routes;
    }),
  createManyplaylist_routes: publicProcedure
    .input(playlist_routesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyplaylist_routes = await ctx.prisma.playlist_routes.createMany(input);
      return createManyplaylist_routes;
    }),
  createOneplaylist_routes: publicProcedure
    .input(playlist_routesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneplaylist_routes = await ctx.prisma.playlist_routes.create(input);
      return createOneplaylist_routes;
    }),
  deleteManyplaylist_routes: publicProcedure
    .input(playlist_routesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyplaylist_routes = await ctx.prisma.playlist_routes.deleteMany(input);
      return deleteManyplaylist_routes;
    }),
  deleteOneplaylist_routes: publicProcedure
    .input(playlist_routesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneplaylist_routes = await ctx.prisma.playlist_routes.delete(input);
      return deleteOneplaylist_routes;
    }),
  findFirstplaylist_routes: publicProcedure
    .input(playlist_routesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstplaylist_routes = await ctx.prisma.playlist_routes.findFirst(input);
      return findFirstplaylist_routes;
    }),
  findFirstplaylist_routesOrThrow: publicProcedure
    .input(playlist_routesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstplaylist_routesOrThrow = await ctx.prisma.playlist_routes.findFirstOrThrow(input);
      return findFirstplaylist_routesOrThrow;
    }),
  findManyplaylist_routes: publicProcedure
    .input(playlist_routesFindManySchema).query(async ({ ctx, input }) => {
      const findManyplaylist_routes = await ctx.prisma.playlist_routes.findMany(input);
      return findManyplaylist_routes;
    }),
  findUniqueplaylist_routes: publicProcedure
    .input(playlist_routesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueplaylist_routes = await ctx.prisma.playlist_routes.findUnique(input);
      return findUniqueplaylist_routes;
    }),
  findUniqueplaylist_routesOrThrow: publicProcedure
    .input(playlist_routesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueplaylist_routesOrThrow = await ctx.prisma.playlist_routes.findUniqueOrThrow(input);
      return findUniqueplaylist_routesOrThrow;
    }),
  groupByplaylist_routes: publicProcedure
    .input(playlist_routesGroupBySchema).query(async ({ ctx, input }) => {
      const groupByplaylist_routes = await ctx.prisma.playlist_routes.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByplaylist_routes;
    }),
  updateManyplaylist_routes: publicProcedure
    .input(playlist_routesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyplaylist_routes = await ctx.prisma.playlist_routes.updateMany(input);
      return updateManyplaylist_routes;
    }),
  updateOneplaylist_routes: publicProcedure
    .input(playlist_routesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneplaylist_routes = await ctx.prisma.playlist_routes.update(input);
      return updateOneplaylist_routes;
    }),
  upsertOneplaylist_routes: publicProcedure
    .input(playlist_routesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneplaylist_routes = await ctx.prisma.playlist_routes.upsert(input);
      return upsertOneplaylist_routes;
    }),

}) 
