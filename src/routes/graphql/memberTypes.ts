import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
} from 'graphql';

const memberTypeType = new GraphQLObjectType({
  name: 'memberType',
  fields: () => ({
    id: { type: GraphQLString },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  }),
});

const memberTypesQuery = {
  type: new GraphQLList(memberTypeType),
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return await context.db.memberTypes.findMany();
  },
};

const memberTypeQuery = {
  type: memberTypeType,
  args: { id: { type: GraphQLString } },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const mte = await context.db.memberTypes.findOne({
      key: 'id',
      equals: args.id,
    });

    if (mte) {
      return mte;
    }
    throw context.httpErrors.notFound();
  },
};

export { memberTypeType, memberTypesQuery, memberTypeQuery };
