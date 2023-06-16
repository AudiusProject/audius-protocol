import { t, publicProcedure } from "./helpers/createRouter";
import { user_bank_accountsAggregateSchema } from "../schemas/aggregateuser_bank_accounts.schema";
import { user_bank_accountsCreateManySchema } from "../schemas/createManyuser_bank_accounts.schema";
import { user_bank_accountsCreateOneSchema } from "../schemas/createOneuser_bank_accounts.schema";
import { user_bank_accountsDeleteManySchema } from "../schemas/deleteManyuser_bank_accounts.schema";
import { user_bank_accountsDeleteOneSchema } from "../schemas/deleteOneuser_bank_accounts.schema";
import { user_bank_accountsFindFirstSchema } from "../schemas/findFirstuser_bank_accounts.schema";
import { user_bank_accountsFindManySchema } from "../schemas/findManyuser_bank_accounts.schema";
import { user_bank_accountsFindUniqueSchema } from "../schemas/findUniqueuser_bank_accounts.schema";
import { user_bank_accountsGroupBySchema } from "../schemas/groupByuser_bank_accounts.schema";
import { user_bank_accountsUpdateManySchema } from "../schemas/updateManyuser_bank_accounts.schema";
import { user_bank_accountsUpdateOneSchema } from "../schemas/updateOneuser_bank_accounts.schema";
import { user_bank_accountsUpsertSchema } from "../schemas/upsertOneuser_bank_accounts.schema";

export const user_bank_accountsRouter = t.router({
  aggregateuser_bank_accounts: publicProcedure
    .input(user_bank_accountsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_bank_accounts = await ctx.prisma.user_bank_accounts.aggregate(input);
      return aggregateuser_bank_accounts;
    }),
  createManyuser_bank_accounts: publicProcedure
    .input(user_bank_accountsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_bank_accounts = await ctx.prisma.user_bank_accounts.createMany(input);
      return createManyuser_bank_accounts;
    }),
  createOneuser_bank_accounts: publicProcedure
    .input(user_bank_accountsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_bank_accounts = await ctx.prisma.user_bank_accounts.create(input);
      return createOneuser_bank_accounts;
    }),
  deleteManyuser_bank_accounts: publicProcedure
    .input(user_bank_accountsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_bank_accounts = await ctx.prisma.user_bank_accounts.deleteMany(input);
      return deleteManyuser_bank_accounts;
    }),
  deleteOneuser_bank_accounts: publicProcedure
    .input(user_bank_accountsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_bank_accounts = await ctx.prisma.user_bank_accounts.delete(input);
      return deleteOneuser_bank_accounts;
    }),
  findFirstuser_bank_accounts: publicProcedure
    .input(user_bank_accountsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_bank_accounts = await ctx.prisma.user_bank_accounts.findFirst(input);
      return findFirstuser_bank_accounts;
    }),
  findFirstuser_bank_accountsOrThrow: publicProcedure
    .input(user_bank_accountsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_bank_accountsOrThrow = await ctx.prisma.user_bank_accounts.findFirstOrThrow(input);
      return findFirstuser_bank_accountsOrThrow;
    }),
  findManyuser_bank_accounts: publicProcedure
    .input(user_bank_accountsFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_bank_accounts = await ctx.prisma.user_bank_accounts.findMany(input);
      return findManyuser_bank_accounts;
    }),
  findUniqueuser_bank_accounts: publicProcedure
    .input(user_bank_accountsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_bank_accounts = await ctx.prisma.user_bank_accounts.findUnique(input);
      return findUniqueuser_bank_accounts;
    }),
  findUniqueuser_bank_accountsOrThrow: publicProcedure
    .input(user_bank_accountsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_bank_accountsOrThrow = await ctx.prisma.user_bank_accounts.findUniqueOrThrow(input);
      return findUniqueuser_bank_accountsOrThrow;
    }),
  groupByuser_bank_accounts: publicProcedure
    .input(user_bank_accountsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_bank_accounts = await ctx.prisma.user_bank_accounts.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_bank_accounts;
    }),
  updateManyuser_bank_accounts: publicProcedure
    .input(user_bank_accountsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_bank_accounts = await ctx.prisma.user_bank_accounts.updateMany(input);
      return updateManyuser_bank_accounts;
    }),
  updateOneuser_bank_accounts: publicProcedure
    .input(user_bank_accountsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_bank_accounts = await ctx.prisma.user_bank_accounts.update(input);
      return updateOneuser_bank_accounts;
    }),
  upsertOneuser_bank_accounts: publicProcedure
    .input(user_bank_accountsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_bank_accounts = await ctx.prisma.user_bank_accounts.upsert(input);
      return upsertOneuser_bank_accounts;
    }),

}) 
