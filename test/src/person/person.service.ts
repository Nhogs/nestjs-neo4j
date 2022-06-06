import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../../../lib';
import { PersonDto } from './dto/person.dto';
import { LikedDto } from './dto/liked.dto';

@Injectable()
export class PersonService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(createPersonDto: PersonDto): Promise<PersonDto> {
    await this.neo4jService.write(
      `CREATE (p:\`Person\`{${Object.keys(createPersonDto)
        .filter((k) => createPersonDto[k] != undefined)
        .map((k) => `${k}:$${k}`)
        .join(`, `)}})`,
      {
        ...createPersonDto,
        age: this.neo4jService.int(createPersonDto.age),
      },
    );
    return createPersonDto;
  }

  async createLiked(
    createLikedDto: LikedDto,
    from: string,
    to: string,
  ): Promise<LikedDto> {
    await this.neo4jService.write(
      `MATCH (f:Person{name:$from}),(t:Person{name:$to}) MERGE (f)-[:LIKED{${Object.keys(
        createLikedDto,
      )
        .map((k) => `${k}:$${k}`)
        .join(`, `)}}]->(t)`,
      {
        ...createLikedDto,
        from,
        to,
      },
    );
    return createLikedDto;
  }

  async findAll(): Promise<PersonDto[]> {
    const results = await this.neo4jService.read(
      'MATCH (p:`Person`) RETURN properties(p) as person ORDER BY person.name ',
    );

    return results.records.map((record) => {
      const person = record.toObject().person;
      return { ...person, age: this.neo4jService.int(person.age).toNumber() };
    });
  }

  async findLiked(name: string): Promise<[LikedDto, PersonDto][]> {
    const results = await this.neo4jService.read(
      'MATCH (f:`Person`{name:$name})-[l:LIKED]->(t:Person) RETURN properties(l) AS liked, properties(t) AS person ORDER BY person.name ',
      { name },
    );

    return results.records.map((record) => {
      const person = record.toObject().person;
      const liked = record.toObject().liked;
      return [
        liked,
        { ...person, age: this.neo4jService.int(person.age).toNumber() },
      ];
    });
  }
}
