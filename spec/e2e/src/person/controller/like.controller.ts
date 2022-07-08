import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { LikeService } from "../service/like.service";
import { PersonService } from "../service/person.service";
import { LikeDto } from "../dto/like.dto";
import { PersonDto } from "../dto/person.dto";

@Controller('LIKE')
export class LikeController {
  constructor(
    private readonly likeService: LikeService,
    private readonly personService: PersonService,
  ) {}

  @Post('/:from/:to')
  async like(
    @Param('from') from: string,
    @Param('to') to: string,
    @Body() createLikedDto: LikeDto,
  ) {
    return this.likeService.create(
      createLikedDto,
      { name: from },
      { name: to },
      this.personService,
      this.personService,
    );
  }

  @Get('/:name')
  async getLiked(@Param('name') name: string): Promise<[LikeDto, PersonDto][]> {
    return this.likeService.findLike(name);
  }
}
