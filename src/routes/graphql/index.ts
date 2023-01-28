import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { graphql, GraphQLObjectType, GraphQLSchema, parse } from 'graphql';
import { validate } from 'graphql/validation';
import { isEmpty } from 'lodash';
import * as depthLimit from 'graphql-depth-limit';

import {
  usersQuery,
  userQuery,
  userCreate,
  userUpdate,
  subscribeTo,
  unsubscribeFrom,
} from './users';
import { profilesQuery, profileQuery } from './profiles';
import { postsQuery, postQuery } from './posts';
import { memberTypesQuery, memberTypeQuery } from './memberTypes';

const DEPTH_LIMIT = 6;

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
  mutation: new GraphQLObjectType({
    name: 'mutation',
    fields: () => ({
      createUser: userCreate,
      updateUser: userUpdate,
      subscribeUserTo: subscribeTo,
      unsubscribeUserFrom: unsubscribeFrom,
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

      try {
        if (
          !isEmpty(
            validate(schema, parse(request.body.query ?? ''), [depthLimit(DEPTH_LIMIT)])
          )
        ) {
          throw new Error();
        }
      } catch (error) {
        return reply.send({
          data: null,
          errors: `Depth more than max level. Limit:: ${DEPTH_LIMIT}`,
        });
      }

      return graphql({
        schema,
        source: String(query),
        variableValues: variables,
        contextValue: {
          fastify,
        },
      });
    }
  );
};

export default plugin;
