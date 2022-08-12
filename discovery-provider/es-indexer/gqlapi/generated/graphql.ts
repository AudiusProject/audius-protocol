import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
  JSON: any;
};

export type Playlist = {
  __typename?: 'Playlist';
  created_at: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  favorite_count: Scalars['Int'];
  favorited_by: Array<User>;
  id: Scalars['String'];
  is_reposted: Scalars['Boolean'];
  is_saved: Scalars['Boolean'];
  name: Scalars['String'];
  repost_count: Scalars['Int'];
  reposted_by: Array<User>;
  tracks: Array<Track>;
};


export type PlaylistFavorited_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type PlaylistReposted_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type PlaylistTracksArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};

export enum PlaylistSort {
  Name = 'name',
  RepostCount = 'repost_count'
}

export type Query = {
  __typename?: 'Query';
  feed: Scalars['JSON'];
  users: Array<User>;
};


export type QueryUsersArgs = {
  handle?: InputMaybe<Scalars['String']>;
};

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Track = {
  __typename?: 'Track';
  favorite_count: Scalars['Int'];
  favorited_by: Array<User>;
  id: Scalars['String'];
  is_reposted: Scalars['Boolean'];
  is_saved: Scalars['Boolean'];
  length: Scalars['Int'];
  repost_count: Scalars['Int'];
  reposted_by: Array<User>;
  stream_urls: Array<Scalars['String']>;
  title: Scalars['String'];
};


export type TrackFavorited_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type TrackReposted_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};

export enum TrackSort {
  Length = 'length',
  RepostCount = 'repost_count',
  Title = 'title'
}

export type User = {
  __typename?: 'User';
  bio?: Maybe<Scalars['String']>;
  follower_count: Scalars['Int'];
  followers: Array<User>;
  following: Array<User>;
  following_count: Scalars['Int'];
  handle: Scalars['String'];
  id: Scalars['String'];
  is_followed: Scalars['Boolean'];
  is_follower: Scalars['Boolean'];
  location?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  playlists: Array<Playlist>;
  tracks: Array<Track>;
};


export type UserFollowersArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<UserSort>;
  sort_direction?: InputMaybe<SortDirection>;
};


export type UserFollowingArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<UserSort>;
  sort_direction?: InputMaybe<SortDirection>;
};


export type UserPlaylistsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<PlaylistSort>;
  sort_direction?: InputMaybe<SortDirection>;
};


export type UserTracksArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<TrackSort>;
  sort_direction?: InputMaybe<SortDirection>;
};

export enum UserSort {
  FollowerCount = 'follower_count',
  FollowingCount = 'following_count',
  Handle = 'handle',
  Name = 'name'
}



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']>;
  Playlist: ResolverTypeWrapper<Playlist>;
  PlaylistSort: PlaylistSort;
  Query: ResolverTypeWrapper<{}>;
  SortDirection: SortDirection;
  String: ResolverTypeWrapper<Scalars['String']>;
  Track: ResolverTypeWrapper<Track>;
  TrackSort: TrackSort;
  User: ResolverTypeWrapper<User>;
  UserSort: UserSort;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean'];
  Date: Scalars['Date'];
  Int: Scalars['Int'];
  JSON: Scalars['JSON'];
  Playlist: Playlist;
  Query: {};
  String: Scalars['String'];
  Track: Track;
  User: User;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type PlaylistResolvers<ContextType = any, ParentType extends ResolversParentTypes['Playlist'] = ResolversParentTypes['Playlist']> = {
  created_at?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  favorite_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  favorited_by?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<PlaylistFavorited_ByArgs, 'limit' | 'offset'>>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  is_reposted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  is_saved?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  repost_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  reposted_by?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<PlaylistReposted_ByArgs, 'limit' | 'offset'>>;
  tracks?: Resolver<Array<ResolversTypes['Track']>, ParentType, ContextType, RequireFields<PlaylistTracksArgs, 'limit' | 'offset'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  feed?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryUsersArgs>>;
};

export type TrackResolvers<ContextType = any, ParentType extends ResolversParentTypes['Track'] = ResolversParentTypes['Track']> = {
  favorite_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  favorited_by?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<TrackFavorited_ByArgs, 'limit' | 'offset'>>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  is_reposted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  is_saved?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  length?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  repost_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  reposted_by?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<TrackReposted_ByArgs, 'limit' | 'offset'>>;
  stream_urls?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  follower_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  followers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<UserFollowersArgs, 'limit' | 'offset'>>;
  following?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<UserFollowingArgs, 'limit' | 'offset'>>;
  following_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  handle?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  is_followed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  is_follower?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  playlists?: Resolver<Array<ResolversTypes['Playlist']>, ParentType, ContextType, RequireFields<UserPlaylistsArgs, 'limit' | 'offset'>>;
  tracks?: Resolver<Array<ResolversTypes['Track']>, ParentType, ContextType, RequireFields<UserTracksArgs, 'limit' | 'offset'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Date?: GraphQLScalarType;
  JSON?: GraphQLScalarType;
  Playlist?: PlaylistResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Track?: TrackResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

