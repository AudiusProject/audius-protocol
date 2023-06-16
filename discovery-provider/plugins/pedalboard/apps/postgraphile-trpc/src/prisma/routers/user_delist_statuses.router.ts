import { t, publicProcedure } from "./helpers/createRouter";
import { user_delist_statusesAggregateSchema } from "../schemas/aggregateuser_delist_statuses.schema";
import { user_delist_statusesCreateManySchema } from "../schemas/createManyuser_delist_statuses.schema";
import { user_delist_statusesCreateOneSchema } from "../schemas/createOneuser_delist_statuses.schema";
import { user_delist_statusesDeleteManySchema } from "../schemas/deleteManyuser_delist_statuses.schema";
import { user_delist_statusesDeleteOneSchema } from "../schemas/deleteOneuser_delist_statuses.schema";
import { user_delist_statusesFindFirstSchema } from "../schemas/findFirstuser_delist_statuses.schema";
import { user_delist_statusesFindManySchema } from "../schemas/findManyuser_delist_statuses.schema";
import { user_delist_statusesFindUniqueSchema } from "../schemas/findUniqueuser_delist_statuses.schema";
import { user_delist_statusesGroupBySchema } from "../schemas/groupByuser_delist_statuses.schema";
import { user_delist_statusesUpdateManySchema } from "../schemas/updateManyuser_delist_statuses.schema";
import { user_delist_statusesUpdateOneSchema } from "../schemas/updateOneuser_delist_statuses.schema";
import { user_delist_statusesUpsertSchema } from "../schemas/upsertOneuser_delist_statuses.schema";

export const user_delist_statusesRouter = t.router({
  aggregateuser_delist_statuses: publicProcedure
    .input(user_delist_statusesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_delist_statuses = await ctx.prisma.user_delist_statuses.aggregate(input);
      return aggregateuser_delist_statuses;
    }),
  createManyuser_delist_statuses: publicProcedure
    .input(user_delist_statusesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_delist_statuses = await ctx.prisma.user_delist_statuses.createMany(input);
      return createManyuser_delist_statuses;
    }),
  createOneuser_delist_statuses: publicProcedure
    .input(user_delist_statusesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_delist_statuses = await ctx.prisma.user_delist_statuses.create(input);
      return createOneuser_delist_statuses;
    }),
  deleteManyuser_delist_statuses: publicProcedure
    .input(user_delist_statusesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_delist_statuses = await ctx.prisma.user_delist_statuses.deleteMany(input);
      return deleteManyuser_delist_statuses;
    }),
  deleteOneuser_delist_statuses: publicProcedure
    .input(user_delist_statusesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_delist_statuses = await ctx.prisma.user_delist_statuses.delete(input);
      return deleteOneuser_delist_statuses;
    }),
  findFirstuser_delist_statuses: publicProcedure
    .input(user_delist_statusesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_delist_statuses = await ctx.prisma.user_delist_statuses.findFirst(input);
      return findFirstuser_delist_statuses;
    }),
  findFirstuser_delist_statusesOrThrow: publicProcedure
    .input(user_delist_statusesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_delist_statusesOrThrow = await ctx.prisma.user_delist_statuses.findFirstOrThrow(input);
      return findFirstuser_delist_statusesOrThrow;
    }),
  findManyuser_delist_statuses: publicProcedure
    .input(user_delist_statusesFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_delist_statuses = await ctx.prisma.user_delist_statuses.findMany(input);
      return findManyuser_delist_statuses;
    }),
  findUniqueuser_delist_statuses: publicProcedure
    .input(user_delist_statusesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_delist_statuses = await ctx.prisma.user_delist_statuses.findUnique(input);
      return findUniqueuser_delist_statuses;
    }),
  findUniqueuser_delist_statusesOrThrow: publicProcedure
    .input(user_delist_statusesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_delist_statusesOrThrow = await ctx.prisma.user_delist_statuses.findUniqueOrThrow(input);
      return findUniqueuser_delist_statusesOrThrow;
    }),
  groupByuser_delist_statuses: publicProcedure
    .input(user_delist_statusesGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_delist_statuses = await ctx.prisma.user_delist_statuses.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_delist_statuses;
    }),
  updateManyuser_delist_statuses: publicProcedure
    .input(user_delist_statusesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_delist_statuses = await ctx.prisma.user_delist_statuses.updateMany(input);
      return updateManyuser_delist_statuses;
    }),
  updateOneuser_delist_statuses: publicProcedure
    .input(user_delist_statusesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_delist_statuses = await ctx.prisma.user_delist_statuses.update(input);
      return updateOneuser_delist_statuses;
    }),
  upsertOneuser_delist_statuses: publicProcedure
    .input(user_delist_statusesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_delist_statuses = await ctx.prisma.user_delist_statuses.upsert(input);
      return upsertOneuser_delist_statuses;
    }),

}) 
