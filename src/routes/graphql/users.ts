import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
} from 'graphql';

import { postType } from './posts';
import { profileType } from './profiles';
import { memberTypeType } from './memberTypes';

const userType = new GraphQLObjectType({
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
        const posts = await context.db.posts.findMany({
          key: 'userId',
          equals: parent.id,
        });
        return posts;
      },
    },
    profile: {
      type: profileType,
      resolve: async (parent: any, args: any, context: any, info: any) => {
        return context.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });
      },
    },
    memberType: {
      type: memberTypeType,
      resolve: async (parent: any, args: any, context: any, info: any) => {
        const userProfile = await context.db.profiles.findOne({
            key: 'userId',
            equals: parent.id,
          });

        if (!userProfile) {
          return null;
        }

        return await context.db.memberTypes.findOne({
          key: 'id',
          equals: userProfile.memberTypeId,
        });
      },
    },
  }),
});

const usersQuery = {
  type: new GraphQLList(userType),
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return await context.db.users.findMany();
  },
};

const userQuery = {
  type: userType,
  args: { id: { type: GraphQLString } },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    console.log(args.id);
    const user = await context.db.users.findOne({
      key: 'id',
      equals: args.id,
    });

    if (user) {
      return user;
    }
    throw context.httpErrors.notFound();
  },
};

export { userType, usersQuery, userQuery };
