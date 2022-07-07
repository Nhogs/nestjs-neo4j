import { Injectable, Logger } from '@nestjs/common';
import { Neo4jModelService, Neo4jService } from '../../../lib';
import { PersonDto } from './dto/person.dto';
import { LikedDto } from './dto/liked.dto';

@Injectable()
export class PersonService extends Neo4jModelService<PersonDto> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
    this.logger.debug = (m) => {
      console.log(m);
    };
  }

  protected label = 'Person';
  protected timestamp = undefined;
  protected logger = new Logger(PersonService.name);

  async createLiked(
    createLikedDto: LikedDto,
    from: string,
    to: string,
  ): Promise<LikedDto> {
    await this.neo4jService.run(
      {
        cypher: `MATCH (f:Person{name:$from}),(t:Person{name:$to}) MERGE (f)-[:LIKED{${Object.keys(
          createLikedDto,
        )
          .map((k) => `${k}:$${k}`)
          .join(`, `)}}]->(t)`,
        parameters: {
          ...createLikedDto,
          from,
          to,
        },
      },
      { write: true },
    );
    return createLikedDto;
  }

  async findAll(): Promise<PersonDto[]> {
    return super.findAll({ orderBy: 'name' });
  }

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
