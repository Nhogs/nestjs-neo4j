import neo4j, { Driver, int, Result, SessionMode } from 'neo4j-driver';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { NEO4J_CONFIG, NEO4J_DRIVER } from '../constant';
import { Neo4jConfig } from '../interface';
import { Neo4jMetadataStorage } from '../storage';

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  constructor(
    @Inject(NEO4J_CONFIG) private readonly config: Neo4jConfig,
    @Inject(NEO4J_DRIVER) private readonly driver: Driver,
  ) {}

  private _getSession(sessionMode: SessionMode, database?: string) {
    return this.driver.session({
      database: database || this.config.database,
      defaultAccessMode: sessionMode,
    });
  }

  int(value: number) {
    return int(value);
  }

  getReadSession(database?: string) {
    return this._getSession(neo4j.session.READ, database);
  }

  getWriteSession(database?: string) {
    return this._getSession(neo4j.session.WRITE, database);
  }

  run(
    cypher: string,
    options: {
      params?: Record<string, any>;
      database?: string;
      write?: boolean;
    },
  ): Result {
    const session = options.write
      ? this.getWriteSession(options.database)
      : this.getReadSession(options.database);
    return session.run(cypher, options.params);
  }

  getCypherConstraints(label?: string): string[] {
    return Neo4jMetadataStorage.getCypherConstraints(label);
  }

  onApplicationShutdown() {
    return this.driver.close();
  }
}
