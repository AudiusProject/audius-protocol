import { t, publicProcedure } from "./helpers/createRouter";
import { associated_walletsAggregateSchema } from "../schemas/aggregateassociated_wallets.schema";
import { associated_walletsCreateManySchema } from "../schemas/createManyassociated_wallets.schema";
import { associated_walletsCreateOneSchema } from "../schemas/createOneassociated_wallets.schema";
import { associated_walletsDeleteManySchema } from "../schemas/deleteManyassociated_wallets.schema";
import { associated_walletsDeleteOneSchema } from "../schemas/deleteOneassociated_wallets.schema";
import { associated_walletsFindFirstSchema } from "../schemas/findFirstassociated_wallets.schema";
import { associated_walletsFindManySchema } from "../schemas/findManyassociated_wallets.schema";
import { associated_walletsFindUniqueSchema } from "../schemas/findUniqueassociated_wallets.schema";
import { associated_walletsGroupBySchema } from "../schemas/groupByassociated_wallets.schema";
import { associated_walletsUpdateManySchema } from "../schemas/updateManyassociated_wallets.schema";
import { associated_walletsUpdateOneSchema } from "../schemas/updateOneassociated_wallets.schema";
import { associated_walletsUpsertSchema } from "../schemas/upsertOneassociated_wallets.schema";

export const associated_walletsRouter = t.router({
  aggregateassociated_wallets: publicProcedure
    .input(associated_walletsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregateassociated_wallets = await ctx.prisma.associated_wallets.aggregate(input);
      return aggregateassociated_wallets;
    }),
  createManyassociated_wallets: publicProcedure
    .input(associated_walletsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManyassociated_wallets = await ctx.prisma.associated_wallets.createMany(input);
      return createManyassociated_wallets;
    }),
  createOneassociated_wallets: publicProcedure
    .input(associated_walletsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOneassociated_wallets = await ctx.prisma.associated_wallets.create(input);
      return createOneassociated_wallets;
    }),
  deleteManyassociated_wallets: publicProcedure
    .input(associated_walletsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManyassociated_wallets = await ctx.prisma.associated_wallets.deleteMany(input);
      return deleteManyassociated_wallets;
    }),
  deleteOneassociated_wallets: publicProcedure
    .input(associated_walletsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOneassociated_wallets = await ctx.prisma.associated_wallets.delete(input);
      return deleteOneassociated_wallets;
    }),
  findFirstassociated_wallets: publicProcedure
    .input(associated_walletsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstassociated_wallets = await ctx.prisma.associated_wallets.findFirst(input);
      return findFirstassociated_wallets;
    }),
  findFirstassociated_walletsOrThrow: publicProcedure
    .input(associated_walletsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstassociated_walletsOrThrow = await ctx.prisma.associated_wallets.findFirstOrThrow(input);
      return findFirstassociated_walletsOrThrow;
    }),
  findManyassociated_wallets: publicProcedure
    .input(associated_walletsFindManySchema).query(async ({ ctx, input }) => {
      const findManyassociated_wallets = await ctx.prisma.associated_wallets.findMany(input);
      return findManyassociated_wallets;
    }),
  findUniqueassociated_wallets: publicProcedure
    .input(associated_walletsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueassociated_wallets = await ctx.prisma.associated_wallets.findUnique(input);
      return findUniqueassociated_wallets;
    }),
  findUniqueassociated_walletsOrThrow: publicProcedure
    .input(associated_walletsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniqueassociated_walletsOrThrow = await ctx.prisma.associated_wallets.findUniqueOrThrow(input);
      return findUniqueassociated_walletsOrThrow;
    }),
  groupByassociated_wallets: publicProcedure
    .input(associated_walletsGroupBySchema).query(async ({ ctx, input }) => {
      const groupByassociated_wallets = await ctx.prisma.associated_wallets.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupByassociated_wallets;
    }),
  updateManyassociated_wallets: publicProcedure
    .input(associated_walletsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManyassociated_wallets = await ctx.prisma.associated_wallets.updateMany(input);
      return updateManyassociated_wallets;
    }),
  updateOneassociated_wallets: publicProcedure
    .input(associated_walletsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOneassociated_wallets = await ctx.prisma.associated_wallets.update(input);
      return updateOneassociated_wallets;
    }),
  upsertOneassociated_wallets: publicProcedure
    .input(associated_walletsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOneassociated_wallets = await ctx.prisma.associated_wallets.upsert(input);
      return upsertOneassociated_wallets;
    }),

}) 
