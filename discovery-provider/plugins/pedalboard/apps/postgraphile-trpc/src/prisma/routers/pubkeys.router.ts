import { t, publicProcedure } from "./helpers/createRouter";
import { pubkeysAggregateSchema } from "../schemas/aggregatepubkeys.schema";
import { pubkeysCreateManySchema } from "../schemas/createManypubkeys.schema";
import { pubkeysCreateOneSchema } from "../schemas/createOnepubkeys.schema";
import { pubkeysDeleteManySchema } from "../schemas/deleteManypubkeys.schema";
import { pubkeysDeleteOneSchema } from "../schemas/deleteOnepubkeys.schema";
import { pubkeysFindFirstSchema } from "../schemas/findFirstpubkeys.schema";
import { pubkeysFindManySchema } from "../schemas/findManypubkeys.schema";
import { pubkeysFindUniqueSchema } from "../schemas/findUniquepubkeys.schema";
import { pubkeysGroupBySchema } from "../schemas/groupBypubkeys.schema";
import { pubkeysUpdateManySchema } from "../schemas/updateManypubkeys.schema";
import { pubkeysUpdateOneSchema } from "../schemas/updateOnepubkeys.schema";
import { pubkeysUpsertSchema } from "../schemas/upsertOnepubkeys.schema";

export const pubkeysRouter = t.router({
  aggregatepubkeys: publicProcedure
    .input(pubkeysAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatepubkeys = await ctx.prisma.pubkeys.aggregate(input);
      return aggregatepubkeys;
    }),
  createManypubkeys: publicProcedure
    .input(pubkeysCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManypubkeys = await ctx.prisma.pubkeys.createMany(input);
      return createManypubkeys;
    }),
  createOnepubkeys: publicProcedure
    .input(pubkeysCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnepubkeys = await ctx.prisma.pubkeys.create(input);
      return createOnepubkeys;
    }),
  deleteManypubkeys: publicProcedure
    .input(pubkeysDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManypubkeys = await ctx.prisma.pubkeys.deleteMany(input);
      return deleteManypubkeys;
    }),
  deleteOnepubkeys: publicProcedure
    .input(pubkeysDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnepubkeys = await ctx.prisma.pubkeys.delete(input);
      return deleteOnepubkeys;
    }),
  findFirstpubkeys: publicProcedure
    .input(pubkeysFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstpubkeys = await ctx.prisma.pubkeys.findFirst(input);
      return findFirstpubkeys;
    }),
  findFirstpubkeysOrThrow: publicProcedure
    .input(pubkeysFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstpubkeysOrThrow = await ctx.prisma.pubkeys.findFirstOrThrow(input);
      return findFirstpubkeysOrThrow;
    }),
  findManypubkeys: publicProcedure
    .input(pubkeysFindManySchema).query(async ({ ctx, input }) => {
      const findManypubkeys = await ctx.prisma.pubkeys.findMany(input);
      return findManypubkeys;
    }),
  findUniquepubkeys: publicProcedure
    .input(pubkeysFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquepubkeys = await ctx.prisma.pubkeys.findUnique(input);
      return findUniquepubkeys;
    }),
  findUniquepubkeysOrThrow: publicProcedure
    .input(pubkeysFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquepubkeysOrThrow = await ctx.prisma.pubkeys.findUniqueOrThrow(input);
      return findUniquepubkeysOrThrow;
    }),
  groupBypubkeys: publicProcedure
    .input(pubkeysGroupBySchema).query(async ({ ctx, input }) => {
      const groupBypubkeys = await ctx.prisma.pubkeys.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBypubkeys;
    }),
  updateManypubkeys: publicProcedure
    .input(pubkeysUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManypubkeys = await ctx.prisma.pubkeys.updateMany(input);
      return updateManypubkeys;
    }),
  updateOnepubkeys: publicProcedure
    .input(pubkeysUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnepubkeys = await ctx.prisma.pubkeys.update(input);
      return updateOnepubkeys;
    }),
  upsertOnepubkeys: publicProcedure
    .input(pubkeysUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnepubkeys = await ctx.prisma.pubkeys.upsert(input);
      return upsertOnepubkeys;
    }),

}) 
