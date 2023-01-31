import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from 'graphql';

const memberTypeType = new GraphQLObjectType({
  name: 'memberType',
  fields: () => ({
    id: { type: GraphQLString },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  }),
});

const updateMemberTypeTypeDto = new GraphQLInputObjectType({
  name: 'updateMemberTypeInputTypeDto',
  fields: () => ({
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  }),
});

const memberTypesQuery = {
  type: new GraphQLList(memberTypeType),
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return await context.fastify.db.memberTypes.findMany();
  },
};

const memberTypeQuery = {
  type: memberTypeType,
  args: { id: { type: GraphQLString } },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const mte = await context.fastify.db.memberTypes.findOne({
      key: 'id',
      equals: args.id,
    });

    if (mte) {
      return mte;
    }
    throw context.fastify.httpErrors.notFound();
  },
};

const memberTypeUpdate = {
  type: memberTypeType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    data: {
      type: updateMemberTypeTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const { id, data } = args,
      memberTypeToUpdate = await context.fastify.db.memberTypes.findOne({
        key: 'id',
        equals: id,
      });

    if (!memberTypeToUpdate) {
      throw context.fastify.httpErrors.notFound();
    }

    return context.fastify.db.memberTypes.change(id, data);
  },
};

export { memberTypeType, memberTypesQuery, memberTypeQuery, memberTypeUpdate };
