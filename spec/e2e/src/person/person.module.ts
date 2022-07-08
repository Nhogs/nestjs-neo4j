import { Module } from '@nestjs/common';
import { PersonController } from './controller/person.controller';
import { PersonService } from './service/person.service';
import { Neo4jModule } from '../../../../lib';
import { LikeService } from './service/like.service';
import { WorkInService } from './service/work.in.service';
import { CompanyService } from './service/company.service';
import { CompanyController } from './controller/company.controller';
import { LikeController } from './controller/like.controller';
import { WorkInController } from './controller/work.in.controller';

@Module({
  imports: [Neo4jModule],
  controllers: [
    PersonController,
    CompanyController,
    LikeController,
    WorkInController,
  ],
  providers: [PersonService, LikeService, WorkInService, CompanyService],
})
export class PersonModule {}
