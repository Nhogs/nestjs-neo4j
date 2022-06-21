import { Logger } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import neo4j from 'neo4j-driver';
import { SessionOptions } from '../interface';

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

  private async _runWithDebug(
    cypher: string,
    options: {
      params?: Record<string, any>;
      sessionOptions?: SessionOptions;
    },
  ) {
    this.logger?.debug({ cypher, options });

    const results = (await this.neo4jService.run(cypher, options)).records.map(
      (r) => r.toObject(),
    );

    this.logger?.debug(results);
    return results;
  }

  private static _convertSkipLimit(params?: { skip?: number; limit?: number }) {
    return {
      skip: neo4j.types.Integer.fromInt(params?.skip || 0),
      limit: neo4j.types.Integer.fromInt(params?.limit || 10),
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

  async create(props: Record<string, any>): Promise<T> {
    this.logger?.debug('create(' + JSON.stringify(props) + ')');

    const res = await this._runWithDebug(
      `CREATE (n:\`${this.label}\`) SET n=$props ${
        this.timestamp ? `SET n.\`${this.timestamp}\` = timestamp() ` : ''
      }RETURN properties(n) AS created`,
      { params: { props }, sessionOptions: { write: true } },
    );

    return res.length > 0 ? (res[0].created as T) : undefined;
  }

  async merge(props: Record<string, any>): Promise<T> {
    this.logger?.debug('merge(' + JSON.stringify(props) + ')');

    const res = await this._runWithDebug(
      `MERGE (n:\`${this.label}\`{${Object.keys(props).map(
        (k) => '`' + k + '`:$props.`' + k + '`',
      )}})${
        this.timestamp
          ? ` ON CREATE SET n.\`${this.timestamp}\` = timestamp()`
          : ''
      } RETURN properties(n) AS merged`,
      { params: { props }, sessionOptions: { write: true } },
    );

    return res.length > 0 ? (res[0].merged as T) : undefined;
  }

  async delete(props: Record<string, any>): Promise<T[]> {
    this.logger?.debug('delete(' + JSON.stringify(props) + ')');

    const res = await this._runWithDebug(
      `MATCH (n:\`${this.label}\`{${Object.keys(props).map(
        (k) => '`' + k + '`:' + JSON.stringify(props[k]),
      )}}) WITH n, properties(n) AS deleted DELETE n RETURN deleted`,
      { params: { props }, sessionOptions: { write: true } },
    );

    return res.map((r) => r.deleted) as T[];
  }

  async findAll(params?: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    this.logger?.debug('findAll(' + JSON.stringify(params) + ')');

    const res = await this._runWithDebug(
      `MATCH (n:\`${this.label}\`) RETURN properties(n) AS matched${
        params?.orderBy
          ? ` ORDER BY n.\`${params?.orderBy}\`` +
            (params?.descending ? ' DESC' : '')
          : ''
      } SKIP $skip LIMIT $limit`,
      {
        params: { ...Neo4jModelService._convertSkipLimit(params) },
      },
    );

    return res.map((r) => r.matched as T);
  }

  async findBy(params: {
    props: Record<string, any>;
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    this.logger?.debug('findBy(' + JSON.stringify(params) + ')');

    const res = await this._runWithDebug(
      `MATCH (n:\`${this.label}\`{${Object.keys(params.props).map(
        (k) => '`' + k + '`:' + JSON.stringify(params.props[k]),
      )}}) RETURN properties(n) AS matched${
        params.orderBy
          ? ` ORDER BY n.\`${params.orderBy}\`` +
            (params.descending ? ' DESC' : '')
          : ''
      } SKIP $skip LIMIT $limit`,
      {
        params: { ...Neo4jModelService._convertSkipLimit(params) },
      },
    );
    return res.map((r) => r.matched as T);
  }

  async searchBy(params: {
    prop: string;
    terms: string[];
    skip?: number;
    limit?: number;
  }): Promise<[T, number][]> {
    this.logger?.debug('findBy(' + JSON.stringify(params) + ')');

    const res = await this._runWithDebug(
      `MATCH (n:\`${this.label}\`) WITH n, split(n.\`${params.prop}\`, ' ') as words
    WHERE ANY (term IN $terms WHERE ANY(word IN words WHERE word CONTAINS term))
    WITH n, words, 
    CASE WHEN apoc.text.join($terms, '') = apoc.text.join(words, '') THEN 100
    ELSE reduce(s = 0, st IN $terms | s + reduce(s2 = 0, w IN words | CASE WHEN (w = st) THEN (s2 + 4) ELSE CASE WHEN (w CONTAINS st) THEN (s2 +2) ELSE (s2) END END)) END AS score 
    ORDER BY score DESC SKIP $skip LIMIT $limit RETURN properties(n) as matched, score`,
      {
        params: {
          terms: params.terms,
          ...Neo4jModelService._convertSkipLimit(params),
        },
      },
    );

    return res.map((r) => {
      return [r.matched as T, r.score.toInt()];
    });
  }
}
