import { t, publicProcedure } from "./helpers/createRouter";
import { user_balancesAggregateSchema } from "../schemas/aggregateuser_balances.schema";
import { user_balancesCreateManySchema } from "../schemas/createManyuser_balances.schema";
import { user_balancesCreateOneSchema } from "../schemas/createOneuser_balances.schema";
import { user_balancesDeleteManySchema } from "../schemas/deleteManyuser_balances.schema";
import { user_balancesDeleteOneSchema } from "../schemas/deleteOneuser_balances.schema";
import { user_balancesFindFirstSchema } from "../schemas/findFirstuser_balances.schema";
import { user_balancesFindManySchema } from "../schemas/findManyuser_balances.schema";
import { user_balancesFindUniqueSchema } from "../schemas/findUniqueuser_balances.schema";
import { user_balancesGroupBySchema } from "../schemas/groupByuser_balances.schema";
import { user_balancesUpdateManySchema } from "../schemas/updateManyuser_balances.schema";
import { user_balancesUpdateOneSchema } from "../schemas/updateOneuser_balances.schema";
import { user_balancesUpsertSchema } from "../schemas/upsertOneuser_balances.schema";

export const user_balancesRouter = t.router({
  aggregateuser_balances: publicProcedure
    .input(user_balancesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_balances = await ctx.prisma.user_balances.aggregate(input);
      return aggregateuser_balances;
    }),
  createManyuser_balances: publicProcedure
    .input(user_balancesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_balances = await ctx.prisma.user_balances.createMany(input);
      return createManyuser_balances;
    }),
  createOneuser_balances: publicProcedure
    .input(user_balancesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_balances = await ctx.prisma.user_balances.create(input);
      return createOneuser_balances;
    }),
  deleteManyuser_balances: publicProcedure
    .input(user_balancesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_balances = await ctx.prisma.user_balances.deleteMany(input);
      return deleteManyuser_balances;
    }),
  deleteOneuser_balances: publicProcedure
    .input(user_balancesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_balances = await ctx.prisma.user_balances.delete(input);
      return deleteOneuser_balances;
    }),
  findFirstuser_balances: publicProcedure
    .input(user_balancesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_balances = await ctx.prisma.user_balances.findFirst(input);
      return findFirstuser_balances;
    }),
  findFirstuser_balancesOrThrow: publicProcedure
    .input(user_balancesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_balancesOrThrow = await ctx.prisma.user_balances.findFirstOrThrow(input);
      return findFirstuser_balancesOrThrow;
    }),
  findManyuser_balances: publicProcedure
    .input(user_balancesFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_balances = await ctx.prisma.user_balances.findMany(input);
      return findManyuser_balances;
    }),
  findUniqueuser_balances: publicProcedure
    .input(user_balancesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_balances = await ctx.prisma.user_balances.findUnique(input);
      return findUniqueuser_balances;
    }),
  findUniqueuser_balancesOrThrow: publicProcedure
    .input(user_balancesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_balancesOrThrow = await ctx.prisma.user_balances.findUniqueOrThrow(input);
      return findUniqueuser_balancesOrThrow;
    }),
  groupByuser_balances: publicProcedure
    .input(user_balancesGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_balances = await ctx.prisma.user_balances.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_balances;
    }),
  updateManyuser_balances: publicProcedure
    .input(user_balancesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_balances = await ctx.prisma.user_balances.updateMany(input);
      return updateManyuser_balances;
    }),
  updateOneuser_balances: publicProcedure
    .input(user_balancesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_balances = await ctx.prisma.user_balances.update(input);
      return updateOneuser_balances;
    }),
  upsertOneuser_balances: publicProcedure
    .input(user_balancesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_balances = await ctx.prisma.user_balances.upsert(input);
      return upsertOneuser_balances;
    }),

}) 
