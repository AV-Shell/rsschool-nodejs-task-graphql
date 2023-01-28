import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from 'graphql';
import { includes, keyBy, filter } from 'lodash';

import { postType } from './posts';
import { profileType } from './profiles';
import { memberTypeType } from './memberTypes';

const userType: any = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    subscribedToUserIds: { type: new GraphQLList(GraphQLID) },
    posts: {
      type: new GraphQLList(postType),
      resolve: async (parent: any, args: any, context: any, info: any) => {
        const posts = await context.fastify.db.posts.findMany({
          key: 'userId',
          equals: parent.id,
        });
        return posts;
      },
    },
    profile: {
      type: profileType,
      resolve: async (parent: any, args: any, context: any, info: any) => {
        return context.fastify.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });
      },
    },
    memberType: {
      type: memberTypeType,
      resolve: async (parent: any, args: any, context: any, info: any) => {
        const userProfile = await context.fastify.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });

        if (!userProfile) {
          return null;
        }

        return await context.fastify.db.memberTypes.findOne({
          key: 'id',
          equals: userProfile.memberTypeId,
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(userType),
      resolve: async (parent: any, args: any, context: any, info: any) => {
        return context.fastify.db.users.findMany({
          key: 'subscribedToUserIds',
          inArray: parent.id,
        });
      },
    },
    subscribedToUser: {
      type: new GraphQLList(userType),
      resolve: async (parent: any, args: any, context: any, info: any) => {
        return context.fastify.db.users.findMany({
          key: 'id',
          equalsAnyOf: parent.subscribedToUserIds,
        });
      },
    },
  }),
});

const createUserTypeDto = new GraphQLInputObjectType({
  name: 'createUserInputTypeDto',
  fields: () => ({
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const updateUserTypeDto = new GraphQLInputObjectType({
  name: 'updateUserInputTypeDto',
  description: 'user input type',
  fields: () => ({
    firstName: { type: GraphQLString, description: 'user name' },
    lastName: { type: GraphQLString, description: 'user soname' },
    email: { type: GraphQLString, description: 'user email' },
  }),
});

const subscriptionUserTypeDto = new GraphQLInputObjectType({
  name: 'subscriptionUserInputTypeDto',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const usersQuery = {
  type: new GraphQLList(userType),
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return await context.fastify.db.users.findMany();
  },
};

const userQuery = {
  type: userType,
  args: { id: { type: GraphQLString } },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    console.log(args.id);
    const user = await context.fastify.db.users.findOne({
      key: 'id',
      equals: args.id,
    });

    if (user) {
      return user;
    }
    throw context.fastify.httpErrors.notFound();
  },
};

const userCreate = {
  type: userType,
  args: {
    data: {
      type: createUserTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return context.fastify.db.users.create(args.data);
  },
};

const userUpdate = {
  type: userType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    data: {
      type: updateUserTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const { id, data } = args,
      userToUpdate = await context.fastify.db.users.findOne({
        key: 'id',
        equals: id,
      });

    if (!userToUpdate) {
      throw context.fastify.httpErrors.notFound();
    }

    return context.fastify.db.users.change(id, data);
  },
};

const subscribeTo = {
  type: userType,
  args: {
    data: {
      type: subscriptionUserTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const { id, userId: subscribeToUserId } = args.data,
      { fastify } = context;

    const users = keyBy(
      await fastify.db.users.findMany({
        key: 'id',
        equalsAnyOf: [id, subscribeToUserId],
      }),
      'id'
    );

    if (!users[id] || !users[subscribeToUserId]) {
      throw fastify.httpErrors.notFound();
    }

    if (includes(users[subscribeToUserId].subscribedToUserIds, id)) {
      throw fastify.httpErrors.badRequest();
    }

    const subscribedToUserIds = [
      ...users[subscribeToUserId].subscribedToUserIds,
      id,
    ];

    await fastify.db.users.change(subscribeToUserId, { subscribedToUserIds });

    return users[id];
  },
};

const unsubscribeFrom = {
  type: userType,
  args: {
    data: {
      type: subscriptionUserTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const { id, userId: subscribeToUserId } = args.data,
      { fastify } = context;

    const users = keyBy(
      await fastify.db.users.findMany({
        key: 'id',
        equalsAnyOf: [id, subscribeToUserId],
      }),
      'id'
    );

    if (!users[id] || !users[subscribeToUserId]) {
      throw fastify.httpErrors.notFound();
    }

    if (!includes(users[subscribeToUserId].subscribedToUserIds, id)) {
      throw fastify.httpErrors.badRequest();
    }

    const subscribedToUserIds = filter(
      users[subscribeToUserId].subscribedToUserIds,
      (uId) => uId != id
    );

    await fastify.db.users.change(subscribeToUserId, { subscribedToUserIds });

    return users[id];
  },
};

export {
  userType,
  usersQuery,
  userQuery,
  userCreate,
  userUpdate,
  subscribeTo,
  unsubscribeFrom,
};
