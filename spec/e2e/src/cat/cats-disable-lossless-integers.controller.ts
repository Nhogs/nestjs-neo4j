import { Body, Controller, Get, Post } from '@nestjs/common';
import { Cat } from './dto/cat';
import { CatsDisableLosslessIntegersService } from './cats-disable-lossless-integers.service';

@Controller('cats')
export class CatsDisableLosslessIntegersController {
  constructor(
    private readonly catsService: CatsDisableLosslessIntegersService,
  ) {}

  @Post()
  async create(@Body() cat: Cat): Promise<Cat> {
    return this.catsService.create(cat).run();
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll().run();
  }
}
