import { t, publicProcedure } from "./helpers/createRouter";
import { chat_message_reactionsAggregateSchema } from "../schemas/aggregatechat_message_reactions.schema";
import { chat_message_reactionsCreateManySchema } from "../schemas/createManychat_message_reactions.schema";
import { chat_message_reactionsCreateOneSchema } from "../schemas/createOnechat_message_reactions.schema";
import { chat_message_reactionsDeleteManySchema } from "../schemas/deleteManychat_message_reactions.schema";
import { chat_message_reactionsDeleteOneSchema } from "../schemas/deleteOnechat_message_reactions.schema";
import { chat_message_reactionsFindFirstSchema } from "../schemas/findFirstchat_message_reactions.schema";
import { chat_message_reactionsFindManySchema } from "../schemas/findManychat_message_reactions.schema";
import { chat_message_reactionsFindUniqueSchema } from "../schemas/findUniquechat_message_reactions.schema";
import { chat_message_reactionsGroupBySchema } from "../schemas/groupBychat_message_reactions.schema";
import { chat_message_reactionsUpdateManySchema } from "../schemas/updateManychat_message_reactions.schema";
import { chat_message_reactionsUpdateOneSchema } from "../schemas/updateOnechat_message_reactions.schema";
import { chat_message_reactionsUpsertSchema } from "../schemas/upsertOnechat_message_reactions.schema";

export const chat_message_reactionsRouter = t.router({
  aggregatechat_message_reactions: publicProcedure
    .input(chat_message_reactionsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechat_message_reactions = await ctx.prisma.chat_message_reactions.aggregate(input);
      return aggregatechat_message_reactions;
    }),
  createManychat_message_reactions: publicProcedure
    .input(chat_message_reactionsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychat_message_reactions = await ctx.prisma.chat_message_reactions.createMany(input);
      return createManychat_message_reactions;
    }),
  createOnechat_message_reactions: publicProcedure
    .input(chat_message_reactionsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechat_message_reactions = await ctx.prisma.chat_message_reactions.create(input);
      return createOnechat_message_reactions;
    }),
  deleteManychat_message_reactions: publicProcedure
    .input(chat_message_reactionsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychat_message_reactions = await ctx.prisma.chat_message_reactions.deleteMany(input);
      return deleteManychat_message_reactions;
    }),
  deleteOnechat_message_reactions: publicProcedure
    .input(chat_message_reactionsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechat_message_reactions = await ctx.prisma.chat_message_reactions.delete(input);
      return deleteOnechat_message_reactions;
    }),
  findFirstchat_message_reactions: publicProcedure
    .input(chat_message_reactionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_message_reactions = await ctx.prisma.chat_message_reactions.findFirst(input);
      return findFirstchat_message_reactions;
    }),
  findFirstchat_message_reactionsOrThrow: publicProcedure
    .input(chat_message_reactionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_message_reactionsOrThrow = await ctx.prisma.chat_message_reactions.findFirstOrThrow(input);
      return findFirstchat_message_reactionsOrThrow;
    }),
  findManychat_message_reactions: publicProcedure
    .input(chat_message_reactionsFindManySchema).query(async ({ ctx, input }) => {
      const findManychat_message_reactions = await ctx.prisma.chat_message_reactions.findMany(input);
      return findManychat_message_reactions;
    }),
  findUniquechat_message_reactions: publicProcedure
    .input(chat_message_reactionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_message_reactions = await ctx.prisma.chat_message_reactions.findUnique(input);
      return findUniquechat_message_reactions;
    }),
  findUniquechat_message_reactionsOrThrow: publicProcedure
    .input(chat_message_reactionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_message_reactionsOrThrow = await ctx.prisma.chat_message_reactions.findUniqueOrThrow(input);
      return findUniquechat_message_reactionsOrThrow;
    }),
  groupBychat_message_reactions: publicProcedure
    .input(chat_message_reactionsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychat_message_reactions = await ctx.prisma.chat_message_reactions.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychat_message_reactions;
    }),
  updateManychat_message_reactions: publicProcedure
    .input(chat_message_reactionsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychat_message_reactions = await ctx.prisma.chat_message_reactions.updateMany(input);
      return updateManychat_message_reactions;
    }),
  updateOnechat_message_reactions: publicProcedure
    .input(chat_message_reactionsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechat_message_reactions = await ctx.prisma.chat_message_reactions.update(input);
      return updateOnechat_message_reactions;
    }),
  upsertOnechat_message_reactions: publicProcedure
    .input(chat_message_reactionsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechat_message_reactions = await ctx.prisma.chat_message_reactions.upsert(input);
      return upsertOnechat_message_reactions;
    }),

}) 
