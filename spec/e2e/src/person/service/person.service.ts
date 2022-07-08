import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../../../../../lib';
import { PersonDto } from '../dto/person.dto';
import { Neo4jNodeModelService } from '../../../../../lib/service/neo4j.node.model.service';
import { CompanyDto } from '../dto/company.dto';
import { WorkInService } from './work.in.service';
import { CompanyService } from './company.service';

@Injectable()
export class PersonService extends Neo4jNodeModelService<PersonDto> {
  constructor(
    protected readonly neo4jService: Neo4jService,
    readonly workInService: WorkInService,
    readonly companyService: CompanyService,
  ) {
    super();
  }

  label = 'Person';
  timestamp = undefined;
  protected logger = new Logger(PersonService.name);

  async createWithCompany(props: {
    person: PersonDto;
    company: CompanyDto;
  }): Promise<void> {
    const session = this.neo4jService.getSession({ write: true });
    const tx = session.beginTransaction();
    this.createInTx(tx, props.person);
    this.companyService.createInTx(tx, props.company);
    this.workInService.createInTx(
      tx,
      {},
      props.person,
      props.company,
      this,
      this.companyService,
    );
    await tx.commit();
  }

  async findAll(): Promise<PersonDto[]> {
    return super.findAll({ orderBy: 'name' });
  }
}
