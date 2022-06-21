import neo4j, {
  Driver,
  RxSession,
  Session,
  Result,
  RxResult,
  Transaction,
  RxTransaction,
  ServerInfo,
} from 'neo4j-driver';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { NEO4J_CONFIG, NEO4J_DRIVER } from '../constant';
import { Neo4jConfig, SessionOptions } from '../interface';
import { Neo4jMetadataStorage } from '../storage';

@Injectable()
/**
 * See https://neo4j.com/docs/api/javascript-driver/current/ for details
 */
export class Neo4jService implements OnApplicationShutdown {
  constructor(
    @Inject(NEO4J_CONFIG) private readonly config: Neo4jConfig,
    @Inject(NEO4J_DRIVER) private readonly driver: Driver,
  ) {}

  private _convertSessionOptions(options: SessionOptions) {
    return {
      database: options?.database || this.config.database,
      defaultAccessMode: options?.write
        ? neo4j.session.WRITE
        : neo4j.session.READ,
    };
  }

  /**
   * Verifies connectivity of this driver by trying to open a connection with the provided driver options.
   */
  verifyConnectivity(options?: { database?: string }): Promise<ServerInfo> {
    return this.driver.verifyConnectivity(options);
  }

  /**
   * Regular Session.
   * Create a session to run Cypher statements in.
   *
   * Note: Always make sure to close sessions when you are done using them!
   */
  getSession(options?: SessionOptions): Session {
    return this.driver.session(this._convertSessionOptions(options));
  }

  /**
   * Reactive session.
   * Create a reactive session to run Cypher statements in.
   *
   * Note: Always make sure to close sessions when you are done using them!
   */
  getRxSession(options?: SessionOptions): RxSession {
    return this.driver.rxSession(this._convertSessionOptions(options));
  }

  /**
   * Run Cypher query in regular session.
   */
  run(
    cypher: string,
    options: {
      params?: Record<string, any>;
      sessionOptions?: SessionOptions;
    },
  ): Result {
    const { params, sessionOptions } = options;
    return this.getSession(sessionOptions).run(cypher, params);
  }

  /**
   * Run Cypher query in reactive session.
   */
  rxRun(
    cypher: string,
    options: {
      params?: Record<string, any>;
      sessionOptions?: SessionOptions;
    },
  ): RxResult {
    const { params, sessionOptions } = options;
    return this.getRxSession(sessionOptions).run(cypher, params);
  }

  /**
   * Returns constraints as runnable Cypher queries defined with decorators on models.
   */
  getCypherConstraints(label?: string): string[] {
    return Neo4jMetadataStorage.getCypherConstraints(label);
  }

  onApplicationShutdown() {
    return this.driver.close();
  }
}

export {
  ServerInfo,
  Session,
  RxSession,
  Result,
  RxResult,
  Transaction,
  RxTransaction,
};
