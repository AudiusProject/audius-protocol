import { t, publicProcedure } from "./helpers/createRouter";
import { track_routesAggregateSchema } from "../schemas/aggregatetrack_routes.schema";
import { track_routesCreateManySchema } from "../schemas/createManytrack_routes.schema";
import { track_routesCreateOneSchema } from "../schemas/createOnetrack_routes.schema";
import { track_routesDeleteManySchema } from "../schemas/deleteManytrack_routes.schema";
import { track_routesDeleteOneSchema } from "../schemas/deleteOnetrack_routes.schema";
import { track_routesFindFirstSchema } from "../schemas/findFirsttrack_routes.schema";
import { track_routesFindManySchema } from "../schemas/findManytrack_routes.schema";
import { track_routesFindUniqueSchema } from "../schemas/findUniquetrack_routes.schema";
import { track_routesGroupBySchema } from "../schemas/groupBytrack_routes.schema";
import { track_routesUpdateManySchema } from "../schemas/updateManytrack_routes.schema";
import { track_routesUpdateOneSchema } from "../schemas/updateOnetrack_routes.schema";
import { track_routesUpsertSchema } from "../schemas/upsertOnetrack_routes.schema";

export const track_routesRouter = t.router({
  aggregatetrack_routes: publicProcedure
    .input(track_routesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatetrack_routes = await ctx.prisma.track_routes.aggregate(input);
      return aggregatetrack_routes;
    }),
  createManytrack_routes: publicProcedure
    .input(track_routesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManytrack_routes = await ctx.prisma.track_routes.createMany(input);
      return createManytrack_routes;
    }),
  createOnetrack_routes: publicProcedure
    .input(track_routesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnetrack_routes = await ctx.prisma.track_routes.create(input);
      return createOnetrack_routes;
    }),
  deleteManytrack_routes: publicProcedure
    .input(track_routesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManytrack_routes = await ctx.prisma.track_routes.deleteMany(input);
      return deleteManytrack_routes;
    }),
  deleteOnetrack_routes: publicProcedure
    .input(track_routesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnetrack_routes = await ctx.prisma.track_routes.delete(input);
      return deleteOnetrack_routes;
    }),
  findFirsttrack_routes: publicProcedure
    .input(track_routesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttrack_routes = await ctx.prisma.track_routes.findFirst(input);
      return findFirsttrack_routes;
    }),
  findFirsttrack_routesOrThrow: publicProcedure
    .input(track_routesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttrack_routesOrThrow = await ctx.prisma.track_routes.findFirstOrThrow(input);
      return findFirsttrack_routesOrThrow;
    }),
  findManytrack_routes: publicProcedure
    .input(track_routesFindManySchema).query(async ({ ctx, input }) => {
      const findManytrack_routes = await ctx.prisma.track_routes.findMany(input);
      return findManytrack_routes;
    }),
  findUniquetrack_routes: publicProcedure
    .input(track_routesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetrack_routes = await ctx.prisma.track_routes.findUnique(input);
      return findUniquetrack_routes;
    }),
  findUniquetrack_routesOrThrow: publicProcedure
    .input(track_routesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetrack_routesOrThrow = await ctx.prisma.track_routes.findUniqueOrThrow(input);
      return findUniquetrack_routesOrThrow;
    }),
  groupBytrack_routes: publicProcedure
    .input(track_routesGroupBySchema).query(async ({ ctx, input }) => {
      const groupBytrack_routes = await ctx.prisma.track_routes.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBytrack_routes;
    }),
  updateManytrack_routes: publicProcedure
    .input(track_routesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManytrack_routes = await ctx.prisma.track_routes.updateMany(input);
      return updateManytrack_routes;
    }),
  updateOnetrack_routes: publicProcedure
    .input(track_routesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnetrack_routes = await ctx.prisma.track_routes.update(input);
      return updateOnetrack_routes;
    }),
  upsertOnetrack_routes: publicProcedure
    .input(track_routesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnetrack_routes = await ctx.prisma.track_routes.upsert(input);
      return upsertOnetrack_routes;
    }),

}) 
