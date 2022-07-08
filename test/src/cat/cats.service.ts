import { Injectable } from '@nestjs/common';
import { Cat } from './dto/cat';
import { int, Neo4jService } from '../../../lib';
import { Neo4jNodeModelService } from '../../../lib/service/neo4j.node.model.service';

@Injectable()
export class CatsService extends Neo4jNodeModelService<Cat> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
  }

  label = 'Cat';

  fromNeo4j(model: Record<string, any>): Cat {
    return {
      ...model,
      age: model.age.toNumber(),
      created: model.created.toString(),
    } as Cat;
  }

  toNeo4j(cat: Record<string, any>): Record<string, any> {
    let result: Record<string, any> = { ...cat };

    if (!isNaN(result.age)) {
      result.age = int(result.age);
    }

    return result;
  }

  // Add a property named 'created' with timestamp on creation
  protected timestamp = 'created';

  async findByName(params: {
    name: string;
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<Cat[]> {
    return super.findBy({
      props: { name: params.name },
      ...params,
    });
  }

  async searchByName(params: {
    search: string;
    skip?: number;
    limit?: number;
  }): Promise<[Cat, number][]> {
    return super.searchBy({
      prop: 'name',
      terms: params.search.split(' '),
      skip: params.skip,
      limit: params.limit,
    });
  }
}
