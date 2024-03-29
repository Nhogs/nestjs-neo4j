import { Injectable, Logger } from '@nestjs/common';
import { Neo4jNodeModelService, Neo4jService } from '../../../../../lib';
import { PersonDto } from '../dto/person.dto';
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
    this.create(props.person, { returns: false }).runTx(tx);
    this.companyService.create(props.company, { returns: false }).runTx(tx);
    this.workInService
      .create({}, props.person, props.company, this, this.companyService, {
        returns: false,
      })
      .runTx(tx);
    await tx.commit();
    return tx.close();
  }

  findAll() {
    return super.findAll({ orderBy: 'name' });
  }
}
