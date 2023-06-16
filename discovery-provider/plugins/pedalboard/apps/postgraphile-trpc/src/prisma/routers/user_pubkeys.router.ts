import { t, publicProcedure } from "./helpers/createRouter";
import { user_pubkeysAggregateSchema } from "../schemas/aggregateuser_pubkeys.schema";
import { user_pubkeysCreateManySchema } from "../schemas/createManyuser_pubkeys.schema";
import { user_pubkeysCreateOneSchema } from "../schemas/createOneuser_pubkeys.schema";
import { user_pubkeysDeleteManySchema } from "../schemas/deleteManyuser_pubkeys.schema";
import { user_pubkeysDeleteOneSchema } from "../schemas/deleteOneuser_pubkeys.schema";
import { user_pubkeysFindFirstSchema } from "../schemas/findFirstuser_pubkeys.schema";
import { user_pubkeysFindManySchema } from "../schemas/findManyuser_pubkeys.schema";
import { user_pubkeysFindUniqueSchema } from "../schemas/findUniqueuser_pubkeys.schema";
import { user_pubkeysGroupBySchema } from "../schemas/groupByuser_pubkeys.schema";
import { user_pubkeysUpdateManySchema } from "../schemas/updateManyuser_pubkeys.schema";
import { user_pubkeysUpdateOneSchema } from "../schemas/updateOneuser_pubkeys.schema";
import { user_pubkeysUpsertSchema } from "../schemas/upsertOneuser_pubkeys.schema";

export const user_pubkeysRouter = t.router({
  aggregateuser_pubkeys: publicProcedure
    .input(user_pubkeysAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateuser_pubkeys = await ctx.prisma.user_pubkeys.aggregate(input);
      return aggregateuser_pubkeys;
    }),
  createManyuser_pubkeys: publicProcedure
    .input(user_pubkeysCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyuser_pubkeys = await ctx.prisma.user_pubkeys.createMany(input);
      return createManyuser_pubkeys;
    }),
  createOneuser_pubkeys: publicProcedure
    .input(user_pubkeysCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneuser_pubkeys = await ctx.prisma.user_pubkeys.create(input);
      return createOneuser_pubkeys;
    }),
  deleteManyuser_pubkeys: publicProcedure
    .input(user_pubkeysDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyuser_pubkeys = await ctx.prisma.user_pubkeys.deleteMany(input);
      return deleteManyuser_pubkeys;
    }),
  deleteOneuser_pubkeys: publicProcedure
    .input(user_pubkeysDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneuser_pubkeys = await ctx.prisma.user_pubkeys.delete(input);
      return deleteOneuser_pubkeys;
    }),
  findFirstuser_pubkeys: publicProcedure
    .input(user_pubkeysFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_pubkeys = await ctx.prisma.user_pubkeys.findFirst(input);
      return findFirstuser_pubkeys;
    }),
  findFirstuser_pubkeysOrThrow: publicProcedure
    .input(user_pubkeysFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstuser_pubkeysOrThrow = await ctx.prisma.user_pubkeys.findFirstOrThrow(input);
      return findFirstuser_pubkeysOrThrow;
    }),
  findManyuser_pubkeys: publicProcedure
    .input(user_pubkeysFindManySchema).query(async ({ ctx, input }) => {
      const findManyuser_pubkeys = await ctx.prisma.user_pubkeys.findMany(input);
      return findManyuser_pubkeys;
    }),
  findUniqueuser_pubkeys: publicProcedure
    .input(user_pubkeysFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_pubkeys = await ctx.prisma.user_pubkeys.findUnique(input);
      return findUniqueuser_pubkeys;
    }),
  findUniqueuser_pubkeysOrThrow: publicProcedure
    .input(user_pubkeysFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueuser_pubkeysOrThrow = await ctx.prisma.user_pubkeys.findUniqueOrThrow(input);
      return findUniqueuser_pubkeysOrThrow;
    }),
  groupByuser_pubkeys: publicProcedure
    .input(user_pubkeysGroupBySchema).query(async ({ ctx, input }) => {
      const groupByuser_pubkeys = await ctx.prisma.user_pubkeys.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByuser_pubkeys;
    }),
  updateManyuser_pubkeys: publicProcedure
    .input(user_pubkeysUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyuser_pubkeys = await ctx.prisma.user_pubkeys.updateMany(input);
      return updateManyuser_pubkeys;
    }),
  updateOneuser_pubkeys: publicProcedure
    .input(user_pubkeysUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneuser_pubkeys = await ctx.prisma.user_pubkeys.update(input);
      return updateOneuser_pubkeys;
    }),
  upsertOneuser_pubkeys: publicProcedure
    .input(user_pubkeysUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneuser_pubkeys = await ctx.prisma.user_pubkeys.upsert(input);
      return upsertOneuser_pubkeys;
    }),

}) 
