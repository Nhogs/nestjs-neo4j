import { Module } from '@nestjs/common';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';
import { Neo4jModule } from '../../../lib';
import { LikedService } from './liked.service';

@Module({
  imports: [Neo4jModule],
  controllers: [PersonController],
  providers: [PersonService, LikedService],
})
export class PersonModule {}
