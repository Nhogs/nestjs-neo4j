import { Module } from '@nestjs/common';
import { Neo4jModule } from '../../lib';
import { CatsModule } from './cat/cats.module';

@Module({
  imports: [
    Neo4jModule.forRoot({
      scheme: 'neo4j',
      host: 'localhost',
      port: '7687',
      database: 'neo4j',
      username: 'neo4j',
      password: 'test',
      global: true,
      disableLosslessIntegers: true,
    }),
    CatsModule,
  ],
})
export class AppModule {}
