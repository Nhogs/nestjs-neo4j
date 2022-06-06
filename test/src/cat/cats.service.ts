import { Injectable } from '@nestjs/common';
import { Cat } from './dto/cat';
import { Neo4jService } from '../../../lib';

@Injectable()
export class CatsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(cat: Cat): Promise<Cat> {
    await this.neo4jService.write(
      'CREATE (c:`Cat`{name:$name, age:$age, breed:$breed})',
      {
        name: cat.name,
        age: this.neo4jService.int(cat.age),
        breed: cat.breed,
      },
    );
    return cat;
  }

  async findAll(): Promise<Cat[]> {
    const results = await this.neo4jService.read(
      'MATCH (c:`Cat`) RETURN properties(c) as cat',
    );

    return results.records.map((record) => {
      const cat = record.toObject().cat;
      return { ...cat, age: cat.age.toInt() };
    });
  }
}
