import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonDto } from './dto/person.dto';
import { LikedDto } from './dto/liked.dto';
import { LikedService } from './liked.service';

@Controller('person')
export class PersonController {
  constructor(
    private readonly personService: PersonService,
    private readonly likedService: LikedService,
  ) {}

  @Post()
  async create(@Body() createPersonDto: PersonDto) {
    return this.personService.create(createPersonDto);
  }

  @Post('/:from/:to')
  async createLiked(
    @Param('from') from: string,
    @Param('to') to: string,
    @Body() createLikedDto: LikedDto,
  ) {
    return this.likedService.create(
      createLikedDto,
      { name: from },
      { name: to },
      this.personService,
      this.personService,
    );
  }

  @Get()
  async findAll(): Promise<PersonDto[]> {
    return this.personService.findAll();
  }

  @Get('/liked/:name')
  async getLiked(
    @Param('name') name: string,
  ): Promise<[LikedDto, PersonDto][]> {
    return this.likedService.findLiked(name);
  }
}
