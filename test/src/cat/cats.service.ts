import { Injectable } from '@nestjs/common';
import { CatDto } from './dto/cat.dto';
import { Neo4jService } from '../../../lib';

@Injectable()
export class CatsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(createCatDto: CatDto): Promise<CatDto> {
    await this.neo4jService.write(
      'CREATE (c:`Cat`{name:$name, age:$age, breed:$breed})',
      {
        name: createCatDto.name,
        age: this.neo4jService.int(createCatDto.age),
        breed: createCatDto.breed,
      },
    );
    return createCatDto;
  }

  async findAll(): Promise<CatDto[]> {
    const results = await this.neo4jService.read(
      'MATCH (c:`Cat`) RETURN c.name as name, c.age as age, c.breed as breed',
    );

    return results.records.map((record) => ({
      name: record.get('name'),
      age: record.get('age').toInt(),
      breed: record.get('breed'),
    }));
  }
}
