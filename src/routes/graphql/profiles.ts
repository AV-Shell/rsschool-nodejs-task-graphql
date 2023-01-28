import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLNonNull,
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

const createProfileTypeDto = new GraphQLInputObjectType({
  name: 'createProfileInputTypeDto',
  fields: () => ({
    avatar: { type: new GraphQLNonNull(GraphQLString) },
    sex: { type: new GraphQLNonNull(GraphQLString) },
    birthday: { type: new GraphQLNonNull(GraphQLInt) },
    country: { type: new GraphQLNonNull(GraphQLString) },
    street: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
  }),
});

const updateProfileTypeDto = new GraphQLInputObjectType({
  name: 'updateProfileInputTypeDto',
  fields: () => ({
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

const profileCreate = {
  type: profileType,
  args: {
    data: {
      type: createProfileTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return context.fastify.db.profiles.create(args.data);
  },
};


const profileUpdate = {
  type: profileType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    data: {
      type: updateProfileTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const { id, data } = args,
      profileToUpdate = await context.fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });

    if (!profileToUpdate) {
      throw context.fastify.httpErrors.notFound();
    }

    return context.fastify.db.profiles.change(id, data);
  },
};


export { profileType, profilesQuery, profileQuery, profileCreate, profileUpdate };
