import { t, publicProcedure } from "./helpers/createRouter";
import { savesAggregateSchema } from "../schemas/aggregatesaves.schema";
import { savesCreateManySchema } from "../schemas/createManysaves.schema";
import { savesCreateOneSchema } from "../schemas/createOnesaves.schema";
import { savesDeleteManySchema } from "../schemas/deleteManysaves.schema";
import { savesDeleteOneSchema } from "../schemas/deleteOnesaves.schema";
import { savesFindFirstSchema } from "../schemas/findFirstsaves.schema";
import { savesFindManySchema } from "../schemas/findManysaves.schema";
import { savesFindUniqueSchema } from "../schemas/findUniquesaves.schema";
import { savesGroupBySchema } from "../schemas/groupBysaves.schema";
import { savesUpdateManySchema } from "../schemas/updateManysaves.schema";
import { savesUpdateOneSchema } from "../schemas/updateOnesaves.schema";
import { savesUpsertSchema } from "../schemas/upsertOnesaves.schema";

export const savesRouter = t.router({
  aggregatesaves: publicProcedure
    .input(savesAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatesaves = await ctx.prisma.saves.aggregate(input);
      return aggregatesaves;
    }),
  createManysaves: publicProcedure
    .input(savesCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManysaves = await ctx.prisma.saves.createMany(input);
      return createManysaves;
    }),
  createOnesaves: publicProcedure
    .input(savesCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnesaves = await ctx.prisma.saves.create(input);
      return createOnesaves;
    }),
  deleteManysaves: publicProcedure
    .input(savesDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManysaves = await ctx.prisma.saves.deleteMany(input);
      return deleteManysaves;
    }),
  deleteOnesaves: publicProcedure
    .input(savesDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnesaves = await ctx.prisma.saves.delete(input);
      return deleteOnesaves;
    }),
  findFirstsaves: publicProcedure
    .input(savesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstsaves = await ctx.prisma.saves.findFirst(input);
      return findFirstsaves;
    }),
  findFirstsavesOrThrow: publicProcedure
    .input(savesFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstsavesOrThrow = await ctx.prisma.saves.findFirstOrThrow(input);
      return findFirstsavesOrThrow;
    }),
  findManysaves: publicProcedure
    .input(savesFindManySchema).query(async ({ ctx, input }) => {
      const findManysaves = await ctx.prisma.saves.findMany(input);
      return findManysaves;
    }),
  findUniquesaves: publicProcedure
    .input(savesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquesaves = await ctx.prisma.saves.findUnique(input);
      return findUniquesaves;
    }),
  findUniquesavesOrThrow: publicProcedure
    .input(savesFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquesavesOrThrow = await ctx.prisma.saves.findUniqueOrThrow(input);
      return findUniquesavesOrThrow;
    }),
  groupBysaves: publicProcedure
    .input(savesGroupBySchema).query(async ({ ctx, input }) => {
      const groupBysaves = await ctx.prisma.saves.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBysaves;
    }),
  updateManysaves: publicProcedure
    .input(savesUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManysaves = await ctx.prisma.saves.updateMany(input);
      return updateManysaves;
    }),
  updateOnesaves: publicProcedure
    .input(savesUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnesaves = await ctx.prisma.saves.update(input);
      return updateOnesaves;
    }),
  upsertOnesaves: publicProcedure
    .input(savesUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnesaves = await ctx.prisma.saves.upsert(input);
      return upsertOnesaves;
    }),

}) 
