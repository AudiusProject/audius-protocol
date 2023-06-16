import { t, publicProcedure } from "./helpers/createRouter";
import { chat_blocked_usersAggregateSchema } from "../schemas/aggregatechat_blocked_users.schema";
import { chat_blocked_usersCreateManySchema } from "../schemas/createManychat_blocked_users.schema";
import { chat_blocked_usersCreateOneSchema } from "../schemas/createOnechat_blocked_users.schema";
import { chat_blocked_usersDeleteManySchema } from "../schemas/deleteManychat_blocked_users.schema";
import { chat_blocked_usersDeleteOneSchema } from "../schemas/deleteOnechat_blocked_users.schema";
import { chat_blocked_usersFindFirstSchema } from "../schemas/findFirstchat_blocked_users.schema";
import { chat_blocked_usersFindManySchema } from "../schemas/findManychat_blocked_users.schema";
import { chat_blocked_usersFindUniqueSchema } from "../schemas/findUniquechat_blocked_users.schema";
import { chat_blocked_usersGroupBySchema } from "../schemas/groupBychat_blocked_users.schema";
import { chat_blocked_usersUpdateManySchema } from "../schemas/updateManychat_blocked_users.schema";
import { chat_blocked_usersUpdateOneSchema } from "../schemas/updateOnechat_blocked_users.schema";
import { chat_blocked_usersUpsertSchema } from "../schemas/upsertOnechat_blocked_users.schema";

export const chat_blocked_usersRouter = t.router({
  aggregatechat_blocked_users: publicProcedure
    .input(chat_blocked_usersAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechat_blocked_users = await ctx.prisma.chat_blocked_users.aggregate(input);
      return aggregatechat_blocked_users;
    }),
  createManychat_blocked_users: publicProcedure
    .input(chat_blocked_usersCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychat_blocked_users = await ctx.prisma.chat_blocked_users.createMany(input);
      return createManychat_blocked_users;
    }),
  createOnechat_blocked_users: publicProcedure
    .input(chat_blocked_usersCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechat_blocked_users = await ctx.prisma.chat_blocked_users.create(input);
      return createOnechat_blocked_users;
    }),
  deleteManychat_blocked_users: publicProcedure
    .input(chat_blocked_usersDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychat_blocked_users = await ctx.prisma.chat_blocked_users.deleteMany(input);
      return deleteManychat_blocked_users;
    }),
  deleteOnechat_blocked_users: publicProcedure
    .input(chat_blocked_usersDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechat_blocked_users = await ctx.prisma.chat_blocked_users.delete(input);
      return deleteOnechat_blocked_users;
    }),
  findFirstchat_blocked_users: publicProcedure
    .input(chat_blocked_usersFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_blocked_users = await ctx.prisma.chat_blocked_users.findFirst(input);
      return findFirstchat_blocked_users;
    }),
  findFirstchat_blocked_usersOrThrow: publicProcedure
    .input(chat_blocked_usersFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_blocked_usersOrThrow = await ctx.prisma.chat_blocked_users.findFirstOrThrow(input);
      return findFirstchat_blocked_usersOrThrow;
    }),
  findManychat_blocked_users: publicProcedure
    .input(chat_blocked_usersFindManySchema).query(async ({ ctx, input }) => {
      const findManychat_blocked_users = await ctx.prisma.chat_blocked_users.findMany(input);
      return findManychat_blocked_users;
    }),
  findUniquechat_blocked_users: publicProcedure
    .input(chat_blocked_usersFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_blocked_users = await ctx.prisma.chat_blocked_users.findUnique(input);
      return findUniquechat_blocked_users;
    }),
  findUniquechat_blocked_usersOrThrow: publicProcedure
    .input(chat_blocked_usersFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_blocked_usersOrThrow = await ctx.prisma.chat_blocked_users.findUniqueOrThrow(input);
      return findUniquechat_blocked_usersOrThrow;
    }),
  groupBychat_blocked_users: publicProcedure
    .input(chat_blocked_usersGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychat_blocked_users = await ctx.prisma.chat_blocked_users.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychat_blocked_users;
    }),
  updateManychat_blocked_users: publicProcedure
    .input(chat_blocked_usersUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychat_blocked_users = await ctx.prisma.chat_blocked_users.updateMany(input);
      return updateManychat_blocked_users;
    }),
  updateOnechat_blocked_users: publicProcedure
    .input(chat_blocked_usersUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechat_blocked_users = await ctx.prisma.chat_blocked_users.update(input);
      return updateOnechat_blocked_users;
    }),
  upsertOnechat_blocked_users: publicProcedure
    .input(chat_blocked_usersUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechat_blocked_users = await ctx.prisma.chat_blocked_users.upsert(input);
      return upsertOnechat_blocked_users;
    }),

}) 
