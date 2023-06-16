import { t, publicProcedure } from "./helpers/createRouter";
import { usersAggregateSchema } from "../schemas/aggregateusers.schema";
import { usersCreateManySchema } from "../schemas/createManyusers.schema";
import { usersCreateOneSchema } from "../schemas/createOneusers.schema";
import { usersDeleteManySchema } from "../schemas/deleteManyusers.schema";
import { usersDeleteOneSchema } from "../schemas/deleteOneusers.schema";
import { usersFindFirstSchema } from "../schemas/findFirstusers.schema";
import { usersFindManySchema } from "../schemas/findManyusers.schema";
import { usersFindUniqueSchema } from "../schemas/findUniqueusers.schema";
import { usersGroupBySchema } from "../schemas/groupByusers.schema";
import { usersUpdateManySchema } from "../schemas/updateManyusers.schema";
import { usersUpdateOneSchema } from "../schemas/updateOneusers.schema";
import { usersUpsertSchema } from "../schemas/upsertOneusers.schema";

export const usersRouter = t.router({
  aggregateusers: publicProcedure
    .input(usersAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateusers = await ctx.prisma.users.aggregate(input);
      return aggregateusers;
    }),
  createManyusers: publicProcedure
    .input(usersCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyusers = await ctx.prisma.users.createMany(input);
      return createManyusers;
    }),
  createOneusers: publicProcedure
    .input(usersCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneusers = await ctx.prisma.users.create(input);
      return createOneusers;
    }),
  deleteManyusers: publicProcedure
    .input(usersDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyusers = await ctx.prisma.users.deleteMany(input);
      return deleteManyusers;
    }),
  deleteOneusers: publicProcedure
    .input(usersDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneusers = await ctx.prisma.users.delete(input);
      return deleteOneusers;
    }),
  findFirstusers: publicProcedure
    .input(usersFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstusers = await ctx.prisma.users.findFirst(input);
      return findFirstusers;
    }),
  findFirstusersOrThrow: publicProcedure
    .input(usersFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstusersOrThrow = await ctx.prisma.users.findFirstOrThrow(input);
      return findFirstusersOrThrow;
    }),
  findManyusers: publicProcedure
    .input(usersFindManySchema).query(async ({ ctx, input }) => {
      const findManyusers = await ctx.prisma.users.findMany(input);
      return findManyusers;
    }),
  findUniqueusers: publicProcedure
    .input(usersFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueusers = await ctx.prisma.users.findUnique(input);
      return findUniqueusers;
    }),
  findUniqueusersOrThrow: publicProcedure
    .input(usersFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueusersOrThrow = await ctx.prisma.users.findUniqueOrThrow(input);
      return findUniqueusersOrThrow;
    }),
  groupByusers: publicProcedure
    .input(usersGroupBySchema).query(async ({ ctx, input }) => {
      const groupByusers = await ctx.prisma.users.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByusers;
    }),
  updateManyusers: publicProcedure
    .input(usersUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyusers = await ctx.prisma.users.updateMany(input);
      return updateManyusers;
    }),
  updateOneusers: publicProcedure
    .input(usersUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneusers = await ctx.prisma.users.update(input);
      return updateOneusers;
    }),
  upsertOneusers: publicProcedure
    .input(usersUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneusers = await ctx.prisma.users.upsert(input);
      return upsertOneusers;
    }),

}) 
