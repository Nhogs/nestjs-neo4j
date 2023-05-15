import { Module } from '@nestjs/common';
import { Neo4jModule } from '../../../lib';
import { CatsDisableLosslessIntegersModule } from './cat/cats-disable-lossless-integers.module';

@Module({
  imports: [
    Neo4jModule.forRoot({
      scheme: 'neo4j',
      host: 'localhost',
      port: '7687',
      database: 'neo4j',
      username: 'neo4j',
      password: 'test_password',
      global: true,
      disableLosslessIntegers: true,
    }),
    CatsDisableLosslessIntegersModule,
  ],
})
export class AppDisableLosslessIntegersModule {}
