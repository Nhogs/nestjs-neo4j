import { Body, Controller, Get, Post } from '@nestjs/common';
import { CatsService } from './cats.service';
import { Cat } from './dto/cat';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  async create(@Body() cat: Cat) {
    return this.catsService.create(cat);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
