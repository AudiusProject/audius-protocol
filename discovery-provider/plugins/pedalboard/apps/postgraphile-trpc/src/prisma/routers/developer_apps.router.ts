import { t, publicProcedure } from "./helpers/createRouter";
import { developer_appsAggregateSchema } from "../schemas/aggregatedeveloper_apps.schema";
import { developer_appsCreateManySchema } from "../schemas/createManydeveloper_apps.schema";
import { developer_appsCreateOneSchema } from "../schemas/createOnedeveloper_apps.schema";
import { developer_appsDeleteManySchema } from "../schemas/deleteManydeveloper_apps.schema";
import { developer_appsDeleteOneSchema } from "../schemas/deleteOnedeveloper_apps.schema";
import { developer_appsFindFirstSchema } from "../schemas/findFirstdeveloper_apps.schema";
import { developer_appsFindManySchema } from "../schemas/findManydeveloper_apps.schema";
import { developer_appsFindUniqueSchema } from "../schemas/findUniquedeveloper_apps.schema";
import { developer_appsGroupBySchema } from "../schemas/groupBydeveloper_apps.schema";
import { developer_appsUpdateManySchema } from "../schemas/updateManydeveloper_apps.schema";
import { developer_appsUpdateOneSchema } from "../schemas/updateOnedeveloper_apps.schema";
import { developer_appsUpsertSchema } from "../schemas/upsertOnedeveloper_apps.schema";

export const developer_appsRouter = t.router({
  aggregatedeveloper_apps: publicProcedure
    .input(developer_appsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatedeveloper_apps = await ctx.prisma.developer_apps.aggregate(input);
      return aggregatedeveloper_apps;
    }),
  createManydeveloper_apps: publicProcedure
    .input(developer_appsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManydeveloper_apps = await ctx.prisma.developer_apps.createMany(input);
      return createManydeveloper_apps;
    }),
  createOnedeveloper_apps: publicProcedure
    .input(developer_appsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnedeveloper_apps = await ctx.prisma.developer_apps.create(input);
      return createOnedeveloper_apps;
    }),
  deleteManydeveloper_apps: publicProcedure
    .input(developer_appsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManydeveloper_apps = await ctx.prisma.developer_apps.deleteMany(input);
      return deleteManydeveloper_apps;
    }),
  deleteOnedeveloper_apps: publicProcedure
    .input(developer_appsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnedeveloper_apps = await ctx.prisma.developer_apps.delete(input);
      return deleteOnedeveloper_apps;
    }),
  findFirstdeveloper_apps: publicProcedure
    .input(developer_appsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstdeveloper_apps = await ctx.prisma.developer_apps.findFirst(input);
      return findFirstdeveloper_apps;
    }),
  findFirstdeveloper_appsOrThrow: publicProcedure
    .input(developer_appsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstdeveloper_appsOrThrow = await ctx.prisma.developer_apps.findFirstOrThrow(input);
      return findFirstdeveloper_appsOrThrow;
    }),
  findManydeveloper_apps: publicProcedure
    .input(developer_appsFindManySchema).query(async ({ ctx, input }) => {
      const findManydeveloper_apps = await ctx.prisma.developer_apps.findMany(input);
      return findManydeveloper_apps;
    }),
  findUniquedeveloper_apps: publicProcedure
    .input(developer_appsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquedeveloper_apps = await ctx.prisma.developer_apps.findUnique(input);
      return findUniquedeveloper_apps;
    }),
  findUniquedeveloper_appsOrThrow: publicProcedure
    .input(developer_appsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquedeveloper_appsOrThrow = await ctx.prisma.developer_apps.findUniqueOrThrow(input);
      return findUniquedeveloper_appsOrThrow;
    }),
  groupBydeveloper_apps: publicProcedure
    .input(developer_appsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBydeveloper_apps = await ctx.prisma.developer_apps.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBydeveloper_apps;
    }),
  updateManydeveloper_apps: publicProcedure
    .input(developer_appsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManydeveloper_apps = await ctx.prisma.developer_apps.updateMany(input);
      return updateManydeveloper_apps;
    }),
  updateOnedeveloper_apps: publicProcedure
    .input(developer_appsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnedeveloper_apps = await ctx.prisma.developer_apps.update(input);
      return updateOnedeveloper_apps;
    }),
  upsertOnedeveloper_apps: publicProcedure
    .input(developer_appsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnedeveloper_apps = await ctx.prisma.developer_apps.upsert(input);
      return upsertOnedeveloper_apps;
    }),

}) 
