import { Injectable } from '@nestjs/common';
import { Cat } from './dto/cat';
import { int, Neo4jService } from '../../../../lib';
import { Neo4jNodeModelService } from '../../../../lib/service/neo4j.node.model.service';

@Injectable()
export class CatsService extends Neo4jNodeModelService<Cat> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
  }

  label = 'Cat';
  logger = undefined;

  fromNeo4j(model: Record<string, any>): Cat {
    return super.fromNeo4j({
      ...model,
      age: model.age.toNumber(),
    });
  }

  toNeo4j(cat: Record<string, any>): Record<string, any> {
    let result: Record<string, any> = { ...cat };

    if (!isNaN(result.age)) {
      result.age = int(result.age);
    }

    return super.toNeo4j(result);
  }

  // Add a property named 'created' with timestamp on creation
  protected timestamp = 'created';

  findByName(
    name: string,
    options?: {
      skip?: number;
      limit?: number;
      orderBy?: string;
      descending?: boolean;
    },
  ) {
    return super.findBy({ name }, options);
  }

  searchByName(
    name: string,
    options?: {
      skip?: number;
      limit?: number;
    },
  ) {
    return super.searchBy('name', name, options);
  }
}
