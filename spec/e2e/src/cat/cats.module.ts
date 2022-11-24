import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { Neo4jModule } from '../../../../lib';

@Module({
  imports: [Neo4jModule],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
