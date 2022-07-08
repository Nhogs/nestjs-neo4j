import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../../../../../lib';
import { Neo4jNodeModelService } from '../../../../../lib/service/neo4j.node.model.service';
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
