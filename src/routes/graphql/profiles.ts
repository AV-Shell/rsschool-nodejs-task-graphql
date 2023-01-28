import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
} from 'graphql';

const profileType = new GraphQLObjectType({
  name: 'profile',
  fields: () => ({
    id: { type: GraphQLID },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLInt },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    userId: { type: GraphQLID },
  }),
});

const profilesQuery = {
  type: new GraphQLList(profileType),
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return await context.fastify.db.profiles.findMany();
  },
};

const profileQuery = {
  type: profileType,
  args: { id: { type: GraphQLString } },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return await context.fastify.db.profiles.findOne({
      key: 'id',
      equals: args.id,
    });
  },
};

export { profileType, profilesQuery, profileQuery };
