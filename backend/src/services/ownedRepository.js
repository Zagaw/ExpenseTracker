import { AppError } from '../utils/AppError.js';
import { parseDocumentId, requireUserId } from '../utils/ownership.js';
import { normalizeDatabaseError, pickOwnedInput } from '../utils/validation.js';

export function createOwnedRepository(Model, config) {
  const { fields, notFoundMessage, duplicateMessage, sort, beforeWrite } = config;

  return {
    list(userId) {
      const ownerId = requireUserId(userId);
      return Model.find({ userId: ownerId }).sort(sort).lean();
    },

    async getById(userId, id) {
      const ownerId = requireUserId(userId);
      const documentId = parseDocumentId(id);

      if (!documentId) {
        throw new AppError(notFoundMessage, 404);
      }

      const document = await Model.findOne({ _id: documentId, userId: ownerId }).lean();

      if (!document) {
        throw new AppError(notFoundMessage, 404);
      }

      return document;
    },

    async create(userId, input) {
      const ownerId = requireUserId(userId);
      let data = pickOwnedInput(input, fields, 'create');

      if (beforeWrite) {
        data = await beforeWrite(ownerId, data, 'create');
      }

      try {
        const document = await Model.create({ ...data, userId: ownerId });
        return document.toObject();
      } catch (error) {
        throw normalizeDatabaseError(error, duplicateMessage);
      }
    },

    async update(userId, id, input) {
      const ownerId = requireUserId(userId);
      const documentId = parseDocumentId(id);

      if (!documentId) {
        throw new AppError(notFoundMessage, 404);
      }

      let data = pickOwnedInput(input, fields, 'update');

      if (beforeWrite) {
        data = await beforeWrite(ownerId, data, 'update');
      }

      if (Object.keys(data).length === 0) {
        throw new AppError('Validation failed', 400, {
          body: 'No valid fields to update',
        });
      }

      try {
        const document = await Model.findOneAndUpdate(
          { _id: documentId, userId: ownerId },
          data,
          { returnDocument: 'after', runValidators: true },
        ).lean();

        if (!document) {
          throw new AppError(notFoundMessage, 404);
        }

        return document;
      } catch (error) {
        throw normalizeDatabaseError(error, duplicateMessage);
      }
    },

    async remove(userId, id) {
      const ownerId = requireUserId(userId);
      const documentId = parseDocumentId(id);

      if (!documentId) {
        throw new AppError(notFoundMessage, 404);
      }

      const document = await Model.findOneAndDelete({
        _id: documentId,
        userId: ownerId,
      }).lean();

      if (!document) {
        throw new AppError(notFoundMessage, 404);
      }

      return document;
    },
  };
}
