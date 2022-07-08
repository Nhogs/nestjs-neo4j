import { Logger } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import neo4j from 'neo4j-driver';
import { Query, SessionOptions } from '../interface';
import { TransactionConfig } from 'neo4j-driver-core/types/session';

/**
 * Helper class to generate model service using Neo4j
 */
export abstract class Neo4jModelService<T> {
  public abstract readonly label: string;
  protected abstract readonly neo4jService: Neo4jService;

  /**
   * Override this to use logger.
   */
  protected readonly logger: Logger;

  /**
   * Override this with property name to generate timestamp on object creation.
   */
  protected readonly timestamp: string;

  toNeo4j(t: Record<string, any>): Record<string, any> {
    return { ...t };
  }

  fromNeo4j(model: Record<string, any>): T {
    return { ...model } as T;
  }

  protected _logArg(name: string, args: IArguments) {
    this.logger?.debug(`${name}(${JSON.stringify(args)})`);
  }

  protected async _runWithDebug(
    query: Query,
    sessionOptions?: SessionOptions,
    transactionConfig?: TransactionConfig,
  ) {
    this._logArg('run', arguments);

    const results = (
      await this.neo4jService.run(query, sessionOptions, transactionConfig)
    ).records.map((r) => r.toObject());

    this.logger?.debug(results);
    return results;
  }

  protected static _convertSkipLimit(params?: {
    skip?: number;
    limit?: number;
  }) {
    return {
      skip: neo4j.int(params?.skip || 0),
      limit: neo4j.int(params?.limit || 10),
    };
  }

  async runCypherConstraints(): Promise<string[]> {
    this.logger?.debug('runCypherConstraints()');
    const queries = this.neo4jService.getCypherConstraints(this.label);

    const session = this.neo4jService.getSession({ write: true });
    const tx = session.beginTransaction();
    queries.forEach((query) => {
      tx.run(query);
    });
    await tx.commit();
    return queries;
  }
}
