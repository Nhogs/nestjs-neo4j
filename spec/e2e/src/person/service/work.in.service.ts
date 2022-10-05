import { Injectable, Logger } from '@nestjs/common';
import {
  Neo4jRelationshipModelService,
  Neo4jService,
} from '../../../../../lib';
import { WorkInDto } from '../dto/work.in.dto';
import { PersonDto } from '../dto/person.dto';
import { CompanyDto } from '../dto/company.dto';

@Injectable()
export class WorkInService extends Neo4jRelationshipModelService<WorkInDto> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
  }

  timestamp = 'since';
  label = 'WORK_IN';
  protected logger = new Logger(WorkInService.name);

  async findAll(): Promise<[PersonDto, WorkInDto, CompanyDto][]> {
    const results = await this.neo4jService.run({
      cypher:
        'MATCH (p:Person)-[w:WORK_IN]->(c:Company) RETURN properties(p) AS person, properties(w) AS work_in, properties(c) AS company',
    });
    return results.records.map((record) => {
      const person = record.toObject().person;
      const work_in = this.fromNeo4j(record.toObject().work_in);
      const company = record.toObject().company;
      return [person, work_in, company];
    });
  }
}
