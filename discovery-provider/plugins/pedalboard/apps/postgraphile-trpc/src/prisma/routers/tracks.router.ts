import { t, publicProcedure } from "./helpers/createRouter";
import { tracksAggregateSchema } from "../schemas/aggregatetracks.schema";
import { tracksCreateManySchema } from "../schemas/createManytracks.schema";
import { tracksCreateOneSchema } from "../schemas/createOnetracks.schema";
import { tracksDeleteManySchema } from "../schemas/deleteManytracks.schema";
import { tracksDeleteOneSchema } from "../schemas/deleteOnetracks.schema";
import { tracksFindFirstSchema } from "../schemas/findFirsttracks.schema";
import { tracksFindManySchema } from "../schemas/findManytracks.schema";
import { tracksFindUniqueSchema } from "../schemas/findUniquetracks.schema";
import { tracksGroupBySchema } from "../schemas/groupBytracks.schema";
import { tracksUpdateManySchema } from "../schemas/updateManytracks.schema";
import { tracksUpdateOneSchema } from "../schemas/updateOnetracks.schema";
import { tracksUpsertSchema } from "../schemas/upsertOnetracks.schema";

export const tracksRouter = t.router({
  aggregatetracks: publicProcedure
    .input(tracksAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatetracks = await ctx.prisma.tracks.aggregate(input);
      return aggregatetracks;
    }),
  createManytracks: publicProcedure
    .input(tracksCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManytracks = await ctx.prisma.tracks.createMany(input);
      return createManytracks;
    }),
  createOnetracks: publicProcedure
    .input(tracksCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnetracks = await ctx.prisma.tracks.create(input);
      return createOnetracks;
    }),
  deleteManytracks: publicProcedure
    .input(tracksDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManytracks = await ctx.prisma.tracks.deleteMany(input);
      return deleteManytracks;
    }),
  deleteOnetracks: publicProcedure
    .input(tracksDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnetracks = await ctx.prisma.tracks.delete(input);
      return deleteOnetracks;
    }),
  findFirsttracks: publicProcedure
    .input(tracksFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttracks = await ctx.prisma.tracks.findFirst(input);
      return findFirsttracks;
    }),
  findFirsttracksOrThrow: publicProcedure
    .input(tracksFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirsttracksOrThrow = await ctx.prisma.tracks.findFirstOrThrow(input);
      return findFirsttracksOrThrow;
    }),
  findManytracks: publicProcedure
    .input(tracksFindManySchema).query(async ({ ctx, input }) => {
      const findManytracks = await ctx.prisma.tracks.findMany(input);
      return findManytracks;
    }),
  findUniquetracks: publicProcedure
    .input(tracksFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetracks = await ctx.prisma.tracks.findUnique(input);
      return findUniquetracks;
    }),
  findUniquetracksOrThrow: publicProcedure
    .input(tracksFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquetracksOrThrow = await ctx.prisma.tracks.findUniqueOrThrow(input);
      return findUniquetracksOrThrow;
    }),
  groupBytracks: publicProcedure
    .input(tracksGroupBySchema).query(async ({ ctx, input }) => {
      const groupBytracks = await ctx.prisma.tracks.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBytracks;
    }),
  updateManytracks: publicProcedure
    .input(tracksUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManytracks = await ctx.prisma.tracks.updateMany(input);
      return updateManytracks;
    }),
  updateOnetracks: publicProcedure
    .input(tracksUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnetracks = await ctx.prisma.tracks.update(input);
      return updateOnetracks;
    }),
  upsertOnetracks: publicProcedure
    .input(tracksUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnetracks = await ctx.prisma.tracks.upsert(input);
      return upsertOnetracks;
    }),

}) 
