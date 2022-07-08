import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../../../lib';
import { PersonDto } from './dto/person.dto';
import { Neo4jNodeModelService } from '../../../lib/service/neo4j.node.model.service';

@Injectable()
export class PersonService extends Neo4jNodeModelService<PersonDto> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
    this.logger.debug = (m) => {
      console.log(m);
    };
  }

  label = 'Person';
  protected logger = new Logger(PersonService.name);

  async findAll(): Promise<PersonDto[]> {
    return super.findAll({ orderBy: 'name' });
  }
}
