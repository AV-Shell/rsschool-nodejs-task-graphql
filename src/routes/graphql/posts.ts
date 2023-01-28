import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLNonNull
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

const createPostTypeDto = new GraphQLInputObjectType({
  name: 'createPostInputTypeDto',
  fields: () => ({
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
  }),
});

const updatePostTypeDto = new GraphQLInputObjectType({
  name: 'updatePostInputTypeDto',
  fields: () => ({
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLID },
  }),
});

const postsQuery = {
  type: new GraphQLList(postType),
  resolve: async (parent: any, args: any, context: any, info: any) => {
    return await context.fastify.db.posts.findMany();
  },
};

const postQuery = {
  type: postType,
  args: { id: { type: GraphQLString } },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const p = await context.fastify.db.posts.findOne({
      key: 'id',
      equals: args.id,
    });

    if (p) {
      return p;
    }
    throw context.fastify.httpErrors.notFound();
  },
};


const postCreate = {
  type: postType,
  args: {
    data: {
      type: createPostTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {

    const postOwner = await context.fastify.db.users.findOne({
      key: 'id',
      equals: args.data.userId,
    });

  if (!postOwner) {
    throw context.fastify.httpErrors.notFound();
  }

    return context.fastify.db.posts.create(args.data);
  },
};


const postUpdate = {
  type: postType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    data: {
      type: updatePostTypeDto,
    },
  },
  resolve: async (parent: any, args: any, context: any, info: any) => {
    const { id, data } = args,
      postToUpdate = await context.fastify.db.posts.findOne({
        key: 'id',
        equals: id,
      });

    if (!postToUpdate) {
      throw context.fastify.httpErrors.notFound();
    }

    return context.fastify.db.posts.change(id, data);
  },
};


export { postType, postsQuery, postQuery, postCreate, postUpdate };
