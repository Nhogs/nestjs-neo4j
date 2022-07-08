import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../../../lib';
import { PersonDto } from './dto/person.dto';
import { LikedDto } from './dto/liked.dto';
import { Neo4jRelationshipModelService } from '../../../lib/service/neo4j.relationship.model.service';

@Injectable()
export class LikedService extends Neo4jRelationshipModelService<PersonDto> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
    this.logger.debug = (m) => {
      console.log(m);
    };
  }

  label = 'LIKED';
  protected logger = new Logger(LikedService.name);

  async findLiked(name: string): Promise<[LikedDto, PersonDto][]> {
    const results = await this.neo4jService.run({
      cypher:
        'MATCH (f:`Person`{name:$name})-[l:LIKED]->(t:Person) RETURN properties(l) AS liked, properties(t) AS person ORDER BY person.name ',
      parameters: { name },
    });

    return results.records.map((record) => {
      const person = record.toObject().person;
      const liked = record.toObject().liked;
      return [liked, person];
    });
  }
}
