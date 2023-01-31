import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { checkIsValidUUID } from '../../utils/checkIsValidUUID';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (req, rep): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<PostEntity> {

      const p = await fastify.db.posts.findOne({
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
        body: createPostBodySchema,
      },
    },
    async function (req, rep): Promise<PostEntity> {
      return await fastify.db.posts.create(req.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<PostEntity> {
      if (!checkIsValidUUID(req?.params?.id)) {
        throw fastify.httpErrors.badRequest();
      }

      return await fastify.db.posts.delete(req?.params?.id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<PostEntity> {
      if (!checkIsValidUUID(req?.params?.id)) {
        throw fastify.httpErrors.badRequest();
      }
      
      const p = await fastify.db.posts.findOne({
        key: 'id',
        equals: req.params.id,
      });

      if (p) {
        return fastify.db.posts.change(req.params.id, req.body);
      }
      throw fastify.httpErrors.notFound();
    }
  );
};

export default plugin;
