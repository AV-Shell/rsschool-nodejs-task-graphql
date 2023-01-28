import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
} from 'graphql';

const postType = new GraphQLObjectType({
  name: 'post',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLID },
  }),
});

const postsQuery = {
  type: new GraphQLList(postType),
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return await context.db.posts.findMany();
  },
};

const postQuery = {
  type: postType,
  args: { id: { type: GraphQLString } },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const p = await context.db.posts.findOne({
      key: 'id',
      equals: args.id,
    });

    if (p) {
      return p;
    }
    throw context.httpErrors.notFound();
  },
};

export { postType, postsQuery, postQuery };
