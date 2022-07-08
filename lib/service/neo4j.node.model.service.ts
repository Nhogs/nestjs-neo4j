import { Transaction } from 'neo4j-driver';
import { Query } from '../interface';
import { Neo4jModelService } from './neo4j.model.service';

/**
 * Helper class to generate Node model service using Neo4j
 */
export abstract class Neo4jNodeModelService<T> extends Neo4jModelService<T> {
  createQuery(props: Record<string, any>, returns = true): Query {
    return {
      cypher: `CREATE (n:\`${this.label}\`) SET n=$props${
        this.timestamp ? `, n.\`${this.timestamp}\` = timestamp()` : ''
      }${returns ? ` RETURN properties(n) AS created` : ''}`,
      parameters: { props: this.toNeo4j(props) },
    };
  }

  async create(props: Record<string, any>): Promise<T> {
    this._logArg('create', arguments);
    const res = await this._runWithDebug(this.createQuery(props), {
      write: true,
    });
    return res.length > 0 ? this.fromNeo4j(res[0].created) : undefined;
  }

  createInTx(tx: Transaction, props: Record<string, any>): Transaction {
    const query = this.createQuery(props, false);
    tx.run(query.cypher, query.parameters);
    return tx;
  }

  mergeQuery(props: Record<string, any>, returns = true): Query {
    const cProps = this.toNeo4j(props);

    return {
      cypher: `MERGE (n:\`${this.label}\`{${Object.keys(cProps).map(
        (k) => '`' + k + '`:$props.`' + k + '`',
      )}})${
        this.timestamp
          ? ` ON CREATE SET n.\`${this.timestamp}\` = timestamp()`
          : ''
      }${returns ? ` RETURN properties(n) AS merged` : ''}`,
      parameters: { props: cProps },
    };
  }

  async merge(props: Record<string, any>): Promise<T> {
    this._logArg('merge', arguments);
    const res = await this._runWithDebug(this.mergeQuery(props), {
      write: true,
    });
    return res.length > 0 ? this.fromNeo4j(res[0].merged) : undefined;
  }

  mergeInTx(tx: Transaction, props: Record<string, any>): Transaction {
    const query = this.mergeQuery(props);
    tx.run(query.cypher, query.parameters);
    return tx;
  }

  deleteQuery(props: Record<string, any>, returns = true): Query {
    const cProps = this.toNeo4j(props);

    return {
      cypher: `MATCH (n:\`${this.label}\`{${Object.keys(cProps).map(
        (k) => '`' + k + '`:' + JSON.stringify(props[k]),
      )}}) WITH n, properties(n) AS deleted DELETE n${
        returns ? ` RETURN deleted` : ''
      }`,
      parameters: { props: cProps },
    };
  }

  async delete(props: Record<string, any>): Promise<T[]> {
    this._logArg('delete', arguments);
    return (
      await this._runWithDebug(this.deleteQuery(props), {
        write: true,
      })
    ).map((r) => this.fromNeo4j(r.deleted));
  }

  deleteInTx(tx: Transaction, props: Record<string, any>): Transaction {
    const query = this.deleteQuery(props, false);
    tx.run(query.cypher, query.parameters);
    return tx;
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
    this._logArg('findAll', arguments);

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
    this._logArg('findBy', arguments);
    return (await this._runWithDebug(this.searchByQuery(params))).map((r) => {
      return [this.fromNeo4j(r.matched), r.score.toInt()];
    });
  }
}
