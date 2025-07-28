import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import {
  AnyEntity,
  EntityRepository,
  FilterQuery,
  FindOneOptions,
  Loaded,
} from '@mikro-orm/core';

@Injectable()
export class OrmHelperService {
  //   async findOrFailWithError<Entity extends AnyEntity, P extends string = never>(
  //     repo: EntityRepository<Entity>,
  //     where: FilterQuery<Entity>,
  //     options?: FindOneOptions<Entity, P>,
  //     customError?: HttpException,
  //   ): Promise<Loaded<Entity, P>> {
  //     const entity = await repo.findOne(where, options);
  //     if (!entity) {
  //       throw customError ?? new NotFoundException('Entity not found');
  //     }
  //     return entity;
  //   }

  async findOrThrow<T>(
    findPromise: Promise<T | null>,
    customError: HttpException = new NotFoundException('Entity not found'),
  ): Promise<T> {
    const entity = await findPromise;
    if (!entity) throw customError;
    return entity;
  }
}
