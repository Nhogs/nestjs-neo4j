import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CompanyService } from '../service/company.service';
import { WorkInDto } from '../dto/work.in.dto';
import { WorkInService } from '../service/work.in.service';
import { PersonService } from '../service/person.service';
import { PersonDto } from '../dto/person.dto';
import { CompanyDto } from '../dto/company.dto';

@Controller('WORK_IN')
export class WorkInController {
  constructor(
    private readonly personService: PersonService,
    private readonly workInService: WorkInService,
    private readonly companyService: CompanyService,
  ) {}

  @Post('/:from/:to')
  async workIn(
    @Param('from') from: string,
    @Param('to') to: string,
    @Body() workInDto: WorkInDto,
  ): Promise<[PersonDto, WorkInDto, CompanyDto][]> {
    return this.workInService
      .create(
        workInDto,
        { name: from },
        { name: to },
        this.personService,
        this.companyService,
      )
      .run();
  }

  @Get()
  async findAll(): Promise<[PersonDto, WorkInDto, CompanyDto][]> {
    return this.workInService.findAll();
  }
}
