import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';

import { usersQuery, userQuery } from './users';
import { profilesQuery, profileQuery } from './profiles';
import { postsQuery, postQuery } from './posts';
import { memberTypesQuery, memberTypeQuery } from './memberTypes';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      users: usersQuery,
      user: userQuery,
      profiles: profilesQuery,
      profile: profileQuery,
      posts: postsQuery,
      post: postQuery,
      memberTypes: memberTypesQuery,
      memberType: memberTypeQuery,
    }),
  }),
});

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      const { query, variables } = request.body;

      return graphql({
        schema,
        source: String(query),
        variableValues: variables,
        contextValue: fastify,
      });
    }
  );
};

export default plugin;
