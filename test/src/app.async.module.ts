import { Module } from '@nestjs/common';
import { Neo4jConfig, Neo4jModule } from '../../lib';
import { CatsModule } from './cat/cats.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    Neo4jModule.forRootAsync({
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
      global: true,
    }),
    CatsModule,
    ConfigModule.forRoot({
      envFilePath: './test/src/.test.env',
    }),
  ],
})
export class AppAsyncModule {}
