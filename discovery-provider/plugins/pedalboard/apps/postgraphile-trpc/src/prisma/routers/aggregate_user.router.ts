import { t, publicProcedure } from "./helpers/createRouter";
import { aggregate_userAggregateSchema } from "../schemas/aggregateaggregate_user.schema";
import { aggregate_userCreateManySchema } from "../schemas/createManyaggregate_user.schema";
import { aggregate_userCreateOneSchema } from "../schemas/createOneaggregate_user.schema";
import { aggregate_userDeleteManySchema } from "../schemas/deleteManyaggregate_user.schema";
import { aggregate_userDeleteOneSchema } from "../schemas/deleteOneaggregate_user.schema";
import { aggregate_userFindFirstSchema } from "../schemas/findFirstaggregate_user.schema";
import { aggregate_userFindManySchema } from "../schemas/findManyaggregate_user.schema";
import { aggregate_userFindUniqueSchema } from "../schemas/findUniqueaggregate_user.schema";
import { aggregate_userGroupBySchema } from "../schemas/groupByaggregate_user.schema";
import { aggregate_userUpdateManySchema } from "../schemas/updateManyaggregate_user.schema";
import { aggregate_userUpdateOneSchema } from "../schemas/updateOneaggregate_user.schema";
import { aggregate_userUpsertSchema } from "../schemas/upsertOneaggregate_user.schema";

export const aggregate_usersRouter = t.router({
  aggregateaggregate_user: publicProcedure
    .input(aggregate_userAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateaggregate_user = await ctx.prisma.aggregate_user.aggregate(input);
      return aggregateaggregate_user;
    }),
  createManyaggregate_user: publicProcedure
    .input(aggregate_userCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyaggregate_user = await ctx.prisma.aggregate_user.createMany(input);
      return createManyaggregate_user;
    }),
  createOneaggregate_user: publicProcedure
    .input(aggregate_userCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneaggregate_user = await ctx.prisma.aggregate_user.create(input);
      return createOneaggregate_user;
    }),
  deleteManyaggregate_user: publicProcedure
    .input(aggregate_userDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyaggregate_user = await ctx.prisma.aggregate_user.deleteMany(input);
      return deleteManyaggregate_user;
    }),
  deleteOneaggregate_user: publicProcedure
    .input(aggregate_userDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneaggregate_user = await ctx.prisma.aggregate_user.delete(input);
      return deleteOneaggregate_user;
    }),
  findFirstaggregate_user: publicProcedure
    .input(aggregate_userFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_user = await ctx.prisma.aggregate_user.findFirst(input);
      return findFirstaggregate_user;
    }),
  findFirstaggregate_userOrThrow: publicProcedure
    .input(aggregate_userFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstaggregate_userOrThrow = await ctx.prisma.aggregate_user.findFirstOrThrow(input);
      return findFirstaggregate_userOrThrow;
    }),
  findManyaggregate_user: publicProcedure
    .input(aggregate_userFindManySchema).query(async ({ ctx, input }) => {
      const findManyaggregate_user = await ctx.prisma.aggregate_user.findMany(input);
      return findManyaggregate_user;
    }),
  findUniqueaggregate_user: publicProcedure
    .input(aggregate_userFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_user = await ctx.prisma.aggregate_user.findUnique(input);
      return findUniqueaggregate_user;
    }),
  findUniqueaggregate_userOrThrow: publicProcedure
    .input(aggregate_userFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueaggregate_userOrThrow = await ctx.prisma.aggregate_user.findUniqueOrThrow(input);
      return findUniqueaggregate_userOrThrow;
    }),
  groupByaggregate_user: publicProcedure
    .input(aggregate_userGroupBySchema).query(async ({ ctx, input }) => {
      const groupByaggregate_user = await ctx.prisma.aggregate_user.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByaggregate_user;
    }),
  updateManyaggregate_user: publicProcedure
    .input(aggregate_userUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyaggregate_user = await ctx.prisma.aggregate_user.updateMany(input);
      return updateManyaggregate_user;
    }),
  updateOneaggregate_user: publicProcedure
    .input(aggregate_userUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneaggregate_user = await ctx.prisma.aggregate_user.update(input);
      return updateOneaggregate_user;
    }),
  upsertOneaggregate_user: publicProcedure
    .input(aggregate_userUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneaggregate_user = await ctx.prisma.aggregate_user.upsert(input);
      return upsertOneaggregate_user;
    }),

}) 
