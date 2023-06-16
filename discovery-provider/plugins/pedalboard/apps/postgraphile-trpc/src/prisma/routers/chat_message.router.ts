import { t, publicProcedure } from "./helpers/createRouter";
import { chat_messageAggregateSchema } from "../schemas/aggregatechat_message.schema";
import { chat_messageCreateManySchema } from "../schemas/createManychat_message.schema";
import { chat_messageCreateOneSchema } from "../schemas/createOnechat_message.schema";
import { chat_messageDeleteManySchema } from "../schemas/deleteManychat_message.schema";
import { chat_messageDeleteOneSchema } from "../schemas/deleteOnechat_message.schema";
import { chat_messageFindFirstSchema } from "../schemas/findFirstchat_message.schema";
import { chat_messageFindManySchema } from "../schemas/findManychat_message.schema";
import { chat_messageFindUniqueSchema } from "../schemas/findUniquechat_message.schema";
import { chat_messageGroupBySchema } from "../schemas/groupBychat_message.schema";
import { chat_messageUpdateManySchema } from "../schemas/updateManychat_message.schema";
import { chat_messageUpdateOneSchema } from "../schemas/updateOnechat_message.schema";
import { chat_messageUpsertSchema } from "../schemas/upsertOnechat_message.schema";

export const chat_messagesRouter = t.router({
  aggregatechat_message: publicProcedure
    .input(chat_messageAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechat_message = await ctx.prisma.chat_message.aggregate(input);
      return aggregatechat_message;
    }),
  createManychat_message: publicProcedure
    .input(chat_messageCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychat_message = await ctx.prisma.chat_message.createMany(input);
      return createManychat_message;
    }),
  createOnechat_message: publicProcedure
    .input(chat_messageCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechat_message = await ctx.prisma.chat_message.create(input);
      return createOnechat_message;
    }),
  deleteManychat_message: publicProcedure
    .input(chat_messageDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychat_message = await ctx.prisma.chat_message.deleteMany(input);
      return deleteManychat_message;
    }),
  deleteOnechat_message: publicProcedure
    .input(chat_messageDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechat_message = await ctx.prisma.chat_message.delete(input);
      return deleteOnechat_message;
    }),
  findFirstchat_message: publicProcedure
    .input(chat_messageFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_message = await ctx.prisma.chat_message.findFirst(input);
      return findFirstchat_message;
    }),
  findFirstchat_messageOrThrow: publicProcedure
    .input(chat_messageFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_messageOrThrow = await ctx.prisma.chat_message.findFirstOrThrow(input);
      return findFirstchat_messageOrThrow;
    }),
  findManychat_message: publicProcedure
    .input(chat_messageFindManySchema).query(async ({ ctx, input }) => {
      const findManychat_message = await ctx.prisma.chat_message.findMany(input);
      return findManychat_message;
    }),
  findUniquechat_message: publicProcedure
    .input(chat_messageFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_message = await ctx.prisma.chat_message.findUnique(input);
      return findUniquechat_message;
    }),
  findUniquechat_messageOrThrow: publicProcedure
    .input(chat_messageFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_messageOrThrow = await ctx.prisma.chat_message.findUniqueOrThrow(input);
      return findUniquechat_messageOrThrow;
    }),
  groupBychat_message: publicProcedure
    .input(chat_messageGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychat_message = await ctx.prisma.chat_message.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychat_message;
    }),
  updateManychat_message: publicProcedure
    .input(chat_messageUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychat_message = await ctx.prisma.chat_message.updateMany(input);
      return updateManychat_message;
    }),
  updateOnechat_message: publicProcedure
    .input(chat_messageUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechat_message = await ctx.prisma.chat_message.update(input);
      return updateOnechat_message;
    }),
  upsertOnechat_message: publicProcedure
    .input(chat_messageUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechat_message = await ctx.prisma.chat_message.upsert(input);
      return upsertOnechat_message;
    }),

}) 
