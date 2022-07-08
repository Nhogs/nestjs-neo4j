import neo4j, {
  Driver,
  QueryResult,
  Result,
  RxResult,
  RxSession,
  RxTransaction,
  ServerInfo,
  Session,
  Transaction,
} from 'neo4j-driver';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { NEO4J_CONFIG, NEO4J_DRIVER } from '../constant';
import { Neo4jConfig, Query, SessionOptions } from '../interface';
import { Neo4jMetadataStorage } from '../storage';
import { TransactionConfig } from 'neo4j-driver-core/types/session';

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
   * Run Cypher query in regular session and close the session after getting results.
   */
  run(
    query: Query,
    sessionOptions?: SessionOptions,
    transactionConfig?: TransactionConfig,
  ): Promise<QueryResult> {
    const session = this.getSession(sessionOptions);
    return session
      .run(query.cypher, query.parameters, transactionConfig)
      .finally(async () => {
        await session.close();
      });
  }

  /**
   * Run Cypher query in reactive session.
   */
  rxRun(
    query: Query,
    sessionOptions?: SessionOptions,
    transactionConfig?: TransactionConfig,
  ): RxResult {
    return this.getRxSession(sessionOptions).run(
      query.cypher,
      query.parameters,
      transactionConfig,
    );
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
  Result,
  RxResult,
  RxSession,
  RxTransaction,
  ServerInfo,
  Session,
  Transaction,
};
