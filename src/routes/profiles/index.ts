import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { checkIsValidUUID } from '../../utils/checkIsValidUUID';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (req, rep): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<ProfileEntity> {

      const p = await fastify.db.profiles.findOne({
        key: 'id',
        equals: req.params.id,
      });

      if (p) {
        return p;
      }
      throw fastify.httpErrors.notFound();
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (req, rep): Promise<ProfileEntity> {
      const { userId, memberTypeId } = req.body,
        user = await fastify.db.users.findOne({ key: 'id', equals: userId }),
        type = await fastify.db.memberTypes.findOne({
          key: 'id',
          equals: memberTypeId,
        }),
        userProfile = await fastify.db.profiles.findOne({
          key: 'userId',
          equals: userId,
        });

      if (!user || !type || userProfile) {
        throw fastify.httpErrors.badRequest();
      }

      return await fastify.db.profiles.create(req.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<ProfileEntity> {
      if (!checkIsValidUUID(req?.params?.id)) {
        throw fastify.httpErrors.badRequest();
      }

      return await fastify.db.profiles.delete(req?.params?.id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<ProfileEntity> {
      if (!checkIsValidUUID(req?.params?.id)) {
        throw fastify.httpErrors.badRequest();
      }

      return fastify.db.profiles.change(req.params.id, req.body);
    }
  );
};

export default plugin;
