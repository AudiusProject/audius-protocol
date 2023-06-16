import { t, publicProcedure } from "./helpers/createRouter";
import { chat_permissionsAggregateSchema } from "../schemas/aggregatechat_permissions.schema";
import { chat_permissionsCreateManySchema } from "../schemas/createManychat_permissions.schema";
import { chat_permissionsCreateOneSchema } from "../schemas/createOnechat_permissions.schema";
import { chat_permissionsDeleteManySchema } from "../schemas/deleteManychat_permissions.schema";
import { chat_permissionsDeleteOneSchema } from "../schemas/deleteOnechat_permissions.schema";
import { chat_permissionsFindFirstSchema } from "../schemas/findFirstchat_permissions.schema";
import { chat_permissionsFindManySchema } from "../schemas/findManychat_permissions.schema";
import { chat_permissionsFindUniqueSchema } from "../schemas/findUniquechat_permissions.schema";
import { chat_permissionsGroupBySchema } from "../schemas/groupBychat_permissions.schema";
import { chat_permissionsUpdateManySchema } from "../schemas/updateManychat_permissions.schema";
import { chat_permissionsUpdateOneSchema } from "../schemas/updateOnechat_permissions.schema";
import { chat_permissionsUpsertSchema } from "../schemas/upsertOnechat_permissions.schema";

export const chat_permissionsRouter = t.router({
  aggregatechat_permissions: publicProcedure
    .input(chat_permissionsAggregateSchema).query(async ({ ctx, input }) => {
      const aggregatechat_permissions = await ctx.prisma.chat_permissions.aggregate(input);
      return aggregatechat_permissions;
    }),
  createManychat_permissions: publicProcedure
    .input(chat_permissionsCreateManySchema).mutation(async ({ ctx, input }) => {
      const createManychat_permissions = await ctx.prisma.chat_permissions.createMany(input);
      return createManychat_permissions;
    }),
  createOnechat_permissions: publicProcedure
    .input(chat_permissionsCreateOneSchema).mutation(async ({ ctx, input }) => {
      const createOnechat_permissions = await ctx.prisma.chat_permissions.create(input);
      return createOnechat_permissions;
    }),
  deleteManychat_permissions: publicProcedure
    .input(chat_permissionsDeleteManySchema).mutation(async ({ ctx, input }) => {
      const deleteManychat_permissions = await ctx.prisma.chat_permissions.deleteMany(input);
      return deleteManychat_permissions;
    }),
  deleteOnechat_permissions: publicProcedure
    .input(chat_permissionsDeleteOneSchema).mutation(async ({ ctx, input }) => {
      const deleteOnechat_permissions = await ctx.prisma.chat_permissions.delete(input);
      return deleteOnechat_permissions;
    }),
  findFirstchat_permissions: publicProcedure
    .input(chat_permissionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_permissions = await ctx.prisma.chat_permissions.findFirst(input);
      return findFirstchat_permissions;
    }),
  findFirstchat_permissionsOrThrow: publicProcedure
    .input(chat_permissionsFindFirstSchema).query(async ({ ctx, input }) => {
      const findFirstchat_permissionsOrThrow = await ctx.prisma.chat_permissions.findFirstOrThrow(input);
      return findFirstchat_permissionsOrThrow;
    }),
  findManychat_permissions: publicProcedure
    .input(chat_permissionsFindManySchema).query(async ({ ctx, input }) => {
      const findManychat_permissions = await ctx.prisma.chat_permissions.findMany(input);
      return findManychat_permissions;
    }),
  findUniquechat_permissions: publicProcedure
    .input(chat_permissionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_permissions = await ctx.prisma.chat_permissions.findUnique(input);
      return findUniquechat_permissions;
    }),
  findUniquechat_permissionsOrThrow: publicProcedure
    .input(chat_permissionsFindUniqueSchema).query(async ({ ctx, input }) => {
      const findUniquechat_permissionsOrThrow = await ctx.prisma.chat_permissions.findUniqueOrThrow(input);
      return findUniquechat_permissionsOrThrow;
    }),
  groupBychat_permissions: publicProcedure
    .input(chat_permissionsGroupBySchema).query(async ({ ctx, input }) => {
      const groupBychat_permissions = await ctx.prisma.chat_permissions.groupBy({ where: input.where, orderBy: input.orderBy, by: input.by, having: input.having, take: input.take, skip: input.skip });
      return groupBychat_permissions;
    }),
  updateManychat_permissions: publicProcedure
    .input(chat_permissionsUpdateManySchema).mutation(async ({ ctx, input }) => {
      const updateManychat_permissions = await ctx.prisma.chat_permissions.updateMany(input);
      return updateManychat_permissions;
    }),
  updateOnechat_permissions: publicProcedure
    .input(chat_permissionsUpdateOneSchema).mutation(async ({ ctx, input }) => {
      const updateOnechat_permissions = await ctx.prisma.chat_permissions.update(input);
      return updateOnechat_permissions;
    }),
  upsertOnechat_permissions: publicProcedure
    .input(chat_permissionsUpsertSchema).mutation(async ({ ctx, input }) => {
      const upsertOnechat_permissions = await ctx.prisma.chat_permissions.upsert(input);
      return upsertOnechat_permissions;
    }),

}) 
