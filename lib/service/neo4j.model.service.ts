import { Logger } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';

/**
 * Helper class to generate model service using Neo4j
 */
export abstract class Neo4jModelService<T> {
  protected abstract getLabel(): string;
  protected abstract getNeo4jService(): Neo4jService;

  private async _run(
    cypher: string,
    options: {
      params?: Record<string, any>;
      write?: boolean;
    },
  ) {
    this.getLogger()?.debug({ cypher, options });

    const results = (
      await this.getNeo4jService().run(cypher, options)
    ).records.map((r) => r.toObject());

    this.getLogger()?.debug(results);
    return results;
  }

  private _convertSkipLimit(params?: { skip?: number; limit?: number }) {
    return {
      skip: this.getNeo4jService().int(params?.skip || 0),
      limit: this.getNeo4jService().int(params?.limit || 10),
    };
  }

  /**
   * Overide this with property name to generate timestamp on object creation
   */
  protected timestampProp(): string | undefined {
    return undefined;
  }

  protected getLogger(): Logger | undefined {
    return undefined;
  }

  async runCypherConstraints(): Promise<string[]> {
    this.getLogger()?.debug('runCypherConstraints()');
    const queries = this.getNeo4jService().getCypherConstraints(
      this.getLabel(),
    );

    const session = this.getNeo4jService().getWriteSession();
    const tx = session.beginTransaction();
    queries.forEach((query) => {
      tx.run(query);
    });
    await tx.commit();
    return queries;
  }

  async create(props: Record<string, any>): Promise<T> {
    this.getLogger()?.debug('create(' + JSON.stringify(props) + ')');

    const timestampProp = this.timestampProp();

    const res = await this._run(
      `CREATE (n:\`${this.getLabel()}\`) SET n=$props ${
        timestampProp ? `SET n.\`${timestampProp}\` = timestamp() ` : ''
      }RETURN properties(n) AS created`,
      { params: { props }, write: true },
    );

    return res.length > 0 ? (res[0].created as T) : undefined;
  }

  async merge(props: Record<string, any>): Promise<T> {
    this.getLogger()?.debug('merge(' + JSON.stringify(props) + ')');

    const timestampProp = this.timestampProp();

    const res = await this._run(
      `MERGE (n:\`${this.getLabel()}\`{${Object.keys(props).map(
        (k) => '`' + k + '`:$props.`' + k + '`',
      )}})${
        timestampProp
          ? ` ON CREATE SET n.\`${timestampProp}\` = timestamp()`
          : ''
      } RETURN properties(n) AS merged`,
      { params: { props }, write: true },
    );

    return res.length > 0 ? (res[0].merged as T) : undefined;
  }

  async delete(props: Record<string, any>): Promise<T[]> {
    this.getLogger()?.debug('delete(' + JSON.stringify(props) + ')');

    const res = await this._run(
      `MATCH (n:\`${this.getLabel()}\`{${Object.keys(props).map(
        (k) => '`' + k + '`:' + JSON.stringify(props[k]),
      )}}) WITH n, properties(n) AS deleted DELETE n RETURN deleted`,
      { params: { props }, write: true },
    );

    return res.map((r) => r.deleted) as T[];
  }

  async findAll(params?: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    this.getLogger()?.debug('findAll(' + JSON.stringify(params) + ')');

    const res = await this._run(
      `MATCH (n:\`${this.getLabel()}\`) RETURN properties(n) AS matched${
        params?.orderBy
          ? ` ORDER BY n.\`${params?.orderBy}\`` +
            (params?.descending ? ' DESC' : '')
          : ''
      } SKIP $skip LIMIT $limit`,
      {
        params: { ...this._convertSkipLimit(params) },
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
    this.getLogger()?.debug('findBy(' + JSON.stringify(params) + ')');

    const res = await this._run(
      `MATCH (n:\`${this.getLabel()}\`{${Object.keys(params.props).map(
        (k) => '`' + k + '`:' + JSON.stringify(params.props[k]),
      )}}) RETURN properties(n) AS matched${
        params.orderBy
          ? ` ORDER BY n.\`${params.orderBy}\`` +
            (params.descending ? ' DESC' : '')
          : ''
      } SKIP $skip LIMIT $limit`,
      {
        params: { ...this._convertSkipLimit(params) },
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
    this.getLogger()?.debug('findBy(' + JSON.stringify(params) + ')');

    const res = await this._run(
      `MATCH (n:\`${this.getLabel()}\`) WITH n, split(n.\`${
        params.prop
      }\`, ' ') as words
    WHERE ANY (term IN $terms WHERE ANY(word IN words WHERE word CONTAINS term))
    WITH n, words, 
    CASE WHEN apoc.text.join($terms, '') = apoc.text.join(words, '') THEN 100
    ELSE reduce(s = 0, st IN $terms | s + reduce(s2 = 0, w IN words | CASE WHEN (w = st) THEN (s2 + 4) ELSE CASE WHEN (w CONTAINS st) THEN (s2 +2) ELSE (s2) END END)) END AS score 
    ORDER BY score DESC SKIP $skip LIMIT $limit RETURN properties(n) as matched, score`,
      {
        params: {
          terms: params.terms,
          ...this._convertSkipLimit(params),
        },
      },
    );

    return res.map((r) => {
      return [r.matched as T, r.score];
    });
  }
}
