import { Module } from '@nestjs/common';
import { NestjsNeo4jService } from './nestjs-neo4j.service';

@Module({
  providers: [NestjsNeo4jService],
  exports: [NestjsNeo4jService],
})
export class NestjsNeo4jModule {}
