import { Body, Controller, Get, Post } from '@nestjs/common';
import { PersonService } from '../service/person.service';
import { PersonDto } from '../dto/person.dto';
import { CompanyDto } from '../dto/company.dto';

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  async create(@Body() createPersonDto: PersonDto): Promise<PersonDto> {
    return this.personService.create(createPersonDto).run();
  }

  @Post('company')
  async createWithCompany(
    @Body() dto: { person: PersonDto; company: CompanyDto },
  ) {
    return this.personService.createWithCompany(dto);
  }

  @Get()
  async findAll(): Promise<PersonDto[]> {
    return this.personService.findAll().run();
  }
}
