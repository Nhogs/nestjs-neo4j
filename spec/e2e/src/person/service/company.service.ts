import { Injectable } from '@nestjs/common';
import { Neo4jNodeModelService, Neo4jService } from '../../../../../lib';
import { CompanyDto } from '../dto/company.dto';

@Injectable()
export class CompanyService extends Neo4jNodeModelService<CompanyDto> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
  }

  label = 'Company';
  timestamp = undefined;
  protected logger = undefined;
}
