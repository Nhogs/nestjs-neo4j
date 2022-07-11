import { Logger } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { Query, SessionOptions } from '../interface';
import { TransactionConfig } from 'neo4j-driver-core/types/session';
import { int } from 'neo4j-driver';

/**
 * Helper class to generate model service using Neo4j.
 */
export abstract class Neo4jModelService<T> {
  protected abstract readonly neo4jService: Neo4jService;

  /**
   * Node or Relationship label.
   */
  public abstract readonly label: string;

  /**
   * Override this to use logger.
   */
  protected abstract readonly logger: Logger | undefined;

  /**
   * Override this with property name to generate timestamp on object creation.
   */
  protected abstract readonly timestamp: string | undefined;

  /**
   * Override this to transform object before sending it to Neo4j.
   * @param params Neo4j compatible Parameters.
   */
  public toNeo4j(params: Partial<T>): Record<string, any> {
    let result: Record<string, any> = { ...params };
    if (this.timestamp && params && params[this.timestamp]) {
      result[this.timestamp] = int(params[this.timestamp].getTime());
    }
    return { ...result };
  }

  /**
   * Override this to transform object coming from Neo4j.
   * @param record Neo4j results to object.
   */
  public fromNeo4j(record: Record<string, any>): T {
    let result: Record<string, any> = { ...record };
    if (this.timestamp && record && record[this.timestamp]) {
      result[this.timestamp] = new Date(result[this.timestamp].toNumber());
    }
    return result as T;
  }

  /**
   * Run cypher constraint for this label in a transaction.
   */
  public async runCypherConstraints(): Promise<string[]> {
    this.logger?.debug('runCypherConstraints()');

    const queries = this.neo4jService.getCypherConstraints(this.label);
    const session = this.neo4jService.getSession({ write: true });

    try {
      const tx = session.beginTransaction();
      queries.forEach((query) => {
        tx.run(query);
      });
      await tx.commit();
    } finally {
      await session.close();
    }

    return queries;
  }

  /**
   * run query with debug log if logger is defined and convert results to objects.
   */
  protected async _run(
    query: Query,
    sessionOptions?: SessionOptions,
    transactionConfig?: TransactionConfig,
  ) {
    this.logger?.debug('_run', arguments);

    const queryResult = await this.neo4jService.run(
      query,
      sessionOptions,
      transactionConfig,
    );

    this.logger?.debug(queryResult);
    return queryResult.records.map((r) => r.toObject());
  }
}
