import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { Neo4jConfig } from './interface';
import { NEO4J_CONFIG, NEO4J_DRIVER } from './constant';
import { Neo4jService } from './service';

export const createDriver = async (config: Neo4jConfig) => {
  const { scheme, host, port, username, password, database, ...driverConfig } =
    config;

  const driver: Driver = neo4j.driver(
    `${scheme}://${host}:${port}`,
    neo4j.auth.basic(username, password),
    driverConfig,
  );

  await driver.verifyConnectivity();

  return driver;
};

@Module({})
export class Neo4jModule {
  static forRoot(config: Neo4jConfig): DynamicModule {
    return {
      module: Neo4jModule,
      global: config.global,
      providers: [
        {
          provide: NEO4J_CONFIG,
          useValue: config,
        },
        {
          provide: NEO4J_DRIVER,
          inject: [NEO4J_CONFIG],
          useFactory: async (config: Neo4jConfig) => createDriver(config),
        },
        Neo4jService,
      ],
      exports: [Neo4jService],
    };
  }

  static forRootAsync(configProvider): DynamicModule {
    return {
      module: Neo4jModule,
      global: configProvider.global,
      imports: [ConfigModule],

      providers: [
        {
          provide: NEO4J_CONFIG,
          ...configProvider,
        } as Provider,
        {
          provide: NEO4J_DRIVER,
          inject: [NEO4J_CONFIG],
          useFactory: async (config: Neo4jConfig) => createDriver(config),
        },
        Neo4jService,
      ],
      exports: [Neo4jService],
    };
  }
}
