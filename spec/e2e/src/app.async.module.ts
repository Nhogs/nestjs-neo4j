import { Module } from '@nestjs/common';
import { Neo4jConfig, Neo4jModule } from '../../../lib';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PersonModule } from './person/person.module';

@Module({
  imports: [
    Neo4jModule.forRootAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Neo4jConfig => ({
        scheme: configService.get('NEO4J_SCHEME'),
        host: configService.get('NEO4J_HOST'),
        port: configService.get('NEO4J_PORT'),
        username: configService.get('NEO4J_USERNAME'),
        password: configService.get('NEO4J_PASSWORD'),
        database: configService.get('NEO4J_DATABASE'),
      }),
    }),
    PersonModule,
    ConfigModule.forRoot({
      envFilePath: './spec/e2e/.test.env',
    }),
  ],
})
export class AppAsyncModule {}
