import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { includes, keyBy, filter } from 'lodash';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { checkIsValidUUID } from '../../utils/checkIsValidUUID';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (req, rep): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<UserEntity> {
      const id = req?.params?.id ?? '';

      const ghostlyUser = await fastify.db.users.findOne({
        key: 'id',
        equalsAnyOf: [id],
      });

      if (!ghostlyUser) {
        throw fastify.httpErrors.notFound();
      } else {
        return ghostlyUser;
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (req, rep): Promise<UserEntity> {
      return await fastify.db.users.create(req.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<UserEntity> {
      const id = req?.params?.id;
      if (!checkIsValidUUID(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const unsubscribeFromUsers = await fastify.db.users.findMany({
        key: 'subscribedToUserIds',
        inArray: id,
      });

      for (let unsubscribeFromUser of unsubscribeFromUsers) {
        const subscribedToUserIds = filter(
          unsubscribeFromUser.subscribedToUserIds,
          (uId) => uId != id
        );

        await fastify.db.users.change(unsubscribeFromUser.id, {
          subscribedToUserIds,
        });
      }

      const postsForDeleting = await fastify.db.posts.findMany({
        key: 'userId',
        equals: id,
      });

      for (let postForDeleting of postsForDeleting) {
        await fastify.db.posts.delete(postForDeleting.id);
      }

      const profilesForDeleting = await fastify.db.profiles.findMany({
        key: 'userId',
        equals: id,
      });

      for (let profileForDeleting of profilesForDeleting) {
        await fastify.db.profiles.delete(profileForDeleting.id);
      }

      return await fastify.db.users.delete(req?.params?.id);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<UserEntity> {
      const id = req?.params?.id;
      const subscribeToUserId = req?.body.userId;

      if (!checkIsValidUUID(id) || !checkIsValidUUID(subscribeToUserId)) {
        throw fastify.httpErrors.badRequest();
      }

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
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<UserEntity> {
      const id = req?.params?.id;
      const subscribeToUserId = req?.body.userId;

      if (!checkIsValidUUID(id) || !checkIsValidUUID(subscribeToUserId)) {
        throw fastify.httpErrors.badRequest();
      }

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
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<UserEntity> {
      if (!checkIsValidUUID(req?.params?.id)) {
        throw fastify.httpErrors.badRequest();
      }

      const ghostlyUser = await fastify.db.users.findOne({
        key: 'id',
        equals: req.params.id,
      });
      if (!ghostlyUser) {
        throw fastify.httpErrors.notFound();
      }

      return fastify.db.users.change(req.params.id, req.body);
    }
  );
};

export default plugin;
