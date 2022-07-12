import { Body, Controller, Get, Post } from '@nestjs/common';
import { CompanyService } from '../service/company.service';
import { CompanyDto } from '../dto/company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  async create(@Body() createCompanyDto: CompanyDto): Promise<CompanyDto> {
    return this.companyService.create(createCompanyDto).run();
  }

  @Get()
  async findAll(): Promise<CompanyDto[]> {
    return this.companyService.findAll().run();
  }
}
