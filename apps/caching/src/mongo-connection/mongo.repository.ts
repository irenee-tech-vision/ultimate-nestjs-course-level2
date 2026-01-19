import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db, ObjectId } from 'mongodb';
import { MONGO_DB_TOKEN, REPOSITORY_COLLECTION_NAME_TOKEN } from './mongo.constants';

export interface FindAllQuery<T> {
  limit?: number;
  sortBy?: keyof T | '_id';
}

@Injectable()
export class MongoRepository<EntityModel extends { _id?: ObjectId }> {
  private collection: Collection<EntityModel>;

  constructor(
    @Inject(MONGO_DB_TOKEN)
    private readonly db: Db,
    @Inject(REPOSITORY_COLLECTION_NAME_TOKEN)
    private readonly collectionName: string,
  ) {
    this.collection = this.db.collection(this.collectionName);
  }

  async create(entity: EntityModel): Promise<EntityModel> {
    const insertResult = await this.collection.insertOne(entity as any);

    const insertedDoc = await this.collection.findOne({
      _id: insertResult.insertedId,
    } as any);

    return insertedDoc as EntityModel;
  }

  async findAll(query: FindAllQuery<EntityModel> = {}): Promise<EntityModel[]> {
    return this.collection
      .find({})
      .limit(query.limit ?? 100)
      .sort((query.sortBy as string) ?? '_id')
      .toArray() as Promise<EntityModel[]>;
  }

  findOneBy(query: Partial<EntityModel>): Promise<EntityModel | null> {
    return this.collection.findOne(query as any) as Promise<EntityModel | null>;
  }

  async findBy(
    query: Partial<EntityModel>,
    options: FindAllQuery<EntityModel> = {},
  ): Promise<EntityModel[]> {
    return this.collection
      .find(query as any)
      .limit(options.limit ?? 100)
      .sort((options.sortBy as string) ?? '_id')
      .toArray() as Promise<EntityModel[]>;
  }

  deleteOneBy(query: Partial<EntityModel>): Promise<EntityModel | null> {
    return this.collection.findOneAndDelete(query as any) as Promise<EntityModel | null>;
  }

  updateOneBy(
    query: Partial<EntityModel>,
    input: Partial<EntityModel>,
  ): Promise<EntityModel | null> {
    return this.collection.findOneAndUpdate(
      query as any,
      { $set: input },
      { returnDocument: 'after' },
    ) as Promise<EntityModel | null>;
  }
}
