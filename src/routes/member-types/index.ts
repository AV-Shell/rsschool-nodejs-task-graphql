import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { includes } from 'lodash';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const checkMemberTypesId = (id: string) => includes(['basic', 'business'], id);

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (req, rep): Promise<MemberTypeEntity[]> {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<MemberTypeEntity> {
      const mte = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: req.params.id,
      });

      if (mte) {
        return mte;
      }
      throw fastify.httpErrors.notFound();
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (req, rep): Promise<MemberTypeEntity> {
      if (!checkMemberTypesId(req?.params?.id)) {
        throw fastify.httpErrors.badRequest();
      }

      const mte = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: req.params.id,
      });

      if (mte) {
        return fastify.db.memberTypes.change(req.params.id, req.body);
      }
      throw fastify.httpErrors.notFound();
    }
  );
};

export default plugin;
