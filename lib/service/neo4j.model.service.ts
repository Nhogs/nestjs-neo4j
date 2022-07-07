import { Logger } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import neo4j from 'neo4j-driver';
import { Query, SessionOptions } from '../interface';
import { TransactionConfig } from 'neo4j-driver-core/types/session';

/**
 * Helper class to generate model service using Neo4j
 */
export abstract class Neo4jModelService<T> {
  protected abstract readonly label: string;
  protected abstract readonly neo4jService: Neo4jService;
  protected abstract readonly logger: Logger;

  /**
   * Override this with property name to generate timestamp on object creation
   */
  protected abstract readonly timestamp: string;

  protected toNeo4j(t: Record<string, any>): Record<string, any> {
    return { ...t };
  }

  protected fromNeo4j(model: Record<string, any>): T {
    return { ...model } as T;
  }

  private async _runWithDebug(
    query: Query,
    sessionOptions?: SessionOptions,
    transactionConfig?: TransactionConfig,
  ) {
    this.logger?.debug({ query, sessionOptions, transactionConfig });

    const results = (
      await this.neo4jService.run(query, sessionOptions, transactionConfig)
    ).records.map((r) => r.toObject());

    this.logger?.debug(results);
    return results;
  }

  private static _convertSkipLimit(params?: { skip?: number; limit?: number }) {
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

  createQuery(props: Record<string, any>): Query {
    return {
      cypher: `CREATE (n:\`${this.label}\`) SET n=$props ${
        this.timestamp ? `SET n.\`${this.timestamp}\` = timestamp() ` : ''
      }RETURN properties(n) AS created`,
      parameters: { props: this.toNeo4j(props) },
    };
  }

  async create(props: Record<string, any>): Promise<T> {
    this.logger?.debug('create(' + JSON.stringify(props) + ')');
    const res = await this._runWithDebug(this.createQuery(props), {
      write: true,
    });
    return res.length > 0 ? this.fromNeo4j(res[0].created) : undefined;
  }

  mergeQuery(props: Record<string, any>): Query {
    return {
      cypher: `MERGE (n:\`${this.label}\`{${Object.keys(props).map(
        (k) => '`' + k + '`:$props.`' + k + '`',
      )}})${
        this.timestamp
          ? ` ON CREATE SET n.\`${this.timestamp}\` = timestamp()`
          : ''
      } RETURN properties(n) AS merged`,
      parameters: { props: this.toNeo4j(props) },
    };
  }

  async merge(props: Record<string, any>): Promise<T> {
    this.logger?.debug('merge(' + JSON.stringify(props) + ')');
    const res = await this._runWithDebug(this.mergeQuery(props), {
      write: true,
    });
    return res.length > 0 ? this.fromNeo4j(res[0].merged) : undefined;
  }

  deleteQuery(props: Record<string, any>): Query {
    return {
      cypher: `MATCH (n:\`${this.label}\`{${Object.keys(props).map(
        (k) => '`' + k + '`:' + JSON.stringify(props[k]),
      )}}) WITH n, properties(n) AS deleted DELETE n RETURN deleted`,
      parameters: { props: this.toNeo4j(props) },
    };
  }

  async delete(props: Record<string, any>): Promise<T[]> {
    this.logger?.debug('delete(' + JSON.stringify(props) + ')');
    return (
      await this._runWithDebug(this.deleteQuery(props), {
        write: true,
      })
    ).map((r) => this.fromNeo4j(r.deleted));
  }

  findAllQuery(params?: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Query {
    return {
      cypher: `MATCH (n:\`${this.label}\`) RETURN properties(n) AS matched${
        params?.orderBy
          ? ` ORDER BY n.\`${params?.orderBy}\`` +
            (params?.descending ? ' DESC' : '')
          : ''
      } SKIP $skip LIMIT $limit`,
      parameters: { ...Neo4jModelService._convertSkipLimit(params) },
    };
  }

  async findAll(params?: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    this.logger?.debug('findAll(' + JSON.stringify(params) + ')');
    return (await this._runWithDebug(this.findAllQuery(params))).map((r) =>
      this.fromNeo4j(r.matched),
    );
  }

  findByQuery(params: {
    props: Record<string, any>;
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Query {
    const props = this.toNeo4j(params.props);
    return {
      cypher: `MATCH (n:\`${this.label}\`{${Object.keys(props).map(
        (k) => '`' + k + '`:' + JSON.stringify(props[k]),
      )}}) RETURN properties(n) AS matched${
        params.orderBy
          ? ` ORDER BY n.\`${params.orderBy}\`` +
            (params.descending ? ' DESC' : '')
          : ''
      } SKIP $skip LIMIT $limit`,
      parameters: { ...Neo4jModelService._convertSkipLimit(params) },
    };
  }

  async findBy(params: {
    props: Record<string, any>;
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    this.logger?.debug('findBy(' + JSON.stringify(params) + ')');
    return (await this._runWithDebug(this.findByQuery(params))).map((r) =>
      this.fromNeo4j(r.matched),
    );
  }

  searchByQuery(params: {
    prop: string;
    terms: string[];
    skip?: number;
    limit?: number;
  }): Query {
    return {
      cypher: `MATCH (n:\`${this.label}\`) WITH n, split(n.\`${params.prop}\`, ' ') as words
    WHERE ANY (term IN $terms WHERE ANY(word IN words WHERE word CONTAINS term))
    WITH n, words, 
    CASE WHEN apoc.text.join($terms, '') = apoc.text.join(words, '') THEN 100
    ELSE reduce(s = 0, st IN $terms | s + reduce(s2 = 0, w IN words | CASE WHEN (w = st) THEN (s2 + 4) ELSE CASE WHEN (w CONTAINS st) THEN (s2 +2) ELSE (s2) END END)) END AS score 
    ORDER BY score DESC SKIP $skip LIMIT $limit RETURN properties(n) as matched, score`,
      parameters: {
        terms: params.terms,
        ...Neo4jModelService._convertSkipLimit(params),
      },
    };
  }

  async searchBy(params: {
    prop: string;
    terms: string[];
    skip?: number;
    limit?: number;
  }): Promise<[T, number][]> {
    this.logger?.debug('findBy(' + JSON.stringify(params) + ')');
    return (await this._runWithDebug(this.searchByQuery(params))).map((r) => {
      return [this.fromNeo4j(r.matched), r.score.toInt()];
    });
  }
}
