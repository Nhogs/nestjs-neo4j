import { Injectable, Logger } from '@nestjs/common';
import {
  Neo4jRelationshipModelService,
  Neo4jService,
} from '../../../../../lib';
import { PersonDto } from '../dto/person.dto';
import { LikeDto } from '../dto/like.dto';

@Injectable()
export class LikeService extends Neo4jRelationshipModelService<LikeDto> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
  }

  timestamp = undefined;
  label = 'LIKE';
  protected logger = new Logger(LikeService.name);

  async findLike(name: string): Promise<[LikeDto, PersonDto][]> {
    const results = await this.neo4jService.run({
      cypher:
        'MATCH (f:`Person`{name:$name})-[l:LIKE]->(t:Person) RETURN properties(l) AS like, properties(t) AS person ORDER BY person.name ',
      parameters: { name },
    });

    return results.records.map((record) => {
      const person = record.toObject().person;
      const like = record.toObject().like;
      return [like, person];
    });
  }
}
