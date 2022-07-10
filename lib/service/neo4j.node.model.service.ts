import { Transaction } from 'neo4j-driver';
import { Query } from '../interface';
import { Neo4jModelService } from './neo4j.model.service';
import {
  NODE,
  SKIP_LIMIT,
  TIMESTAMP,
  neo4jSkipLimit,
  ORDER_BY,
} from '../common';

/**
 * Helper class to generate Node model service using Neo4j
 */
export abstract class Neo4jNodeModelService<T> extends Neo4jModelService<T> {
  createQuery(properties: Partial<T>, returns = true): Query {
    const props = this.toNeo4j(properties);

    const CREATE = `CREATE ${NODE('n', this.label)}`;
    const SET = ` SET n=$props${TIMESTAMP('n', this.timestamp, ', ')}`;
    const RETURN = `${returns ? ` RETURN properties(n) AS created` : ''}`;

    return {
      cypher: `${CREATE}${SET}${RETURN}`,
      parameters: { props },
    };
  }

  mergeQuery(properties: Partial<T>, returns = true): Query {
    const props = this.toNeo4j(properties);

    const MERGE = `MERGE ${NODE('n', this.label, { props })}`;
    const SET = `${TIMESTAMP('n', this.timestamp, ' ON CREATE SET ')}`;
    const RETURN = `${returns ? ` RETURN properties(n) AS merged` : ''}`;

    return {
      cypher: `${MERGE}${SET}${RETURN}`,
      parameters: { props },
    };
  }

  updateQuery(
    match: Partial<T>,
    update: Partial<T>,
    mutate = true,
    returns = true,
  ): Query {
    const props = this.toNeo4j(match);
    const updates = this.toNeo4j(update);

    const MATCH = `MATCH ${NODE('n', this.label, { props })}`;
    const SET = ` SET n ${mutate ? '+' : ''}= $updates`;
    const RETURN = `${returns ? ` RETURN properties(n) AS updated` : ''}`;

    return {
      cypher: `${MATCH}${SET}${RETURN}`,
      parameters: { props, updates },
    };
  }

  deleteQuery(properties: Partial<T>, returns = true): Query {
    const props = this.toNeo4j(properties);

    const MATCH = `MATCH ${NODE('n', this.label, { props })}`;
    const WITH = ` WITH n, properties(n) AS deleted`;
    const DELETE = ` DELETE n`;
    const RETURN = `${returns ? ` RETURN deleted` : ''}`;

    return {
      cypher: `${MATCH}${WITH}${DELETE}${RETURN}`,
      parameters: { props },
    };
  }

  findAllQuery(p?: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Query {
    const MATCH = `MATCH ${NODE('n', this.label)}`;
    const RETURN = ` RETURN properties(n) AS matched`;

    return {
      cypher: `${MATCH}${RETURN}${ORDER_BY(
        'n',
        p?.orderBy,
        p?.descending,
      )}${SKIP_LIMIT(p)}`,
      parameters: neo4jSkipLimit(p),
    };
  }

  findByQuery(p: {
    props: Partial<T>;
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Query {
    const props = this.toNeo4j(p.props);

    const MATCH = `MATCH ${NODE('n', this.label, { props })}`;
    const RETURN = ` RETURN properties(n) AS matched`;

    return {
      cypher: `${MATCH}${RETURN}${ORDER_BY(
        'n',
        p?.orderBy,
        p?.descending,
      )}${SKIP_LIMIT(props)}`,
      parameters: { props, ...neo4jSkipLimit(p) },
    };
  }

  searchByQuery(params: {
    prop: keyof T;
    terms: string[];
    skip?: number;
    limit?: number;
  }): Query {
    const MATCH = `MATCH ${NODE('n', this.label)}`;
    const WITH = ` WITH n, split(n.\`${String(params.prop)}\`, ' ') as words`;

    return {
      cypher: `${MATCH}${WITH}
    WHERE ANY (term IN $terms WHERE ANY(word IN words WHERE word CONTAINS term))
    WITH n, words, 
    CASE WHEN apoc.text.join($terms, '') = apoc.text.join(words, '') THEN 100
    ELSE reduce(s = 0, st IN $terms | s + reduce(s2 = 0, w IN words | CASE WHEN (w = st) THEN (s2 + 4) ELSE CASE WHEN (w CONTAINS st) THEN (s2 +2) ELSE (s2) END END)) END AS score 
    ORDER BY score DESC${SKIP_LIMIT(
      params,
    )} RETURN properties(n) as matched, score`,
      parameters: {
        terms: params.terms,
        ...neo4jSkipLimit(params),
      },
    };
  }

  async create(props: Partial<T>): Promise<T> {
    const res = await this._run(this.createQuery(props), {
      write: true,
    });
    return res.length > 0 ? this.fromNeo4j(res[0].created) : undefined;
  }

  createInTx(tx: Transaction, props: Partial<T>): Transaction {
    const query = this.createQuery(props, false);
    tx.run(query.cypher, query.parameters);
    return tx;
  }

  async merge(props: Partial<T>): Promise<T> {
    const res = await this._run(this.mergeQuery(props), {
      write: true,
    });
    return res.length > 0 ? this.fromNeo4j(res[0].merged) : undefined;
  }

  mergeInTx(tx: Transaction, props: Partial<T>): Transaction {
    const query = this.mergeQuery(props);
    tx.run(query.cypher, query.parameters);
    return tx;
  }

  async update(
    match: Partial<T>,
    update: Partial<T>,
    mutate = true,
  ): Promise<T> {
    const res = await this._run(this.updateQuery(match, update, mutate), {
      write: true,
    });
    return res.length > 0 ? this.fromNeo4j(res[0].updated) : undefined;
  }

  updateInTx(
    tx: Transaction,
    match: Partial<T>,
    update: Partial<T>,
    mutate = true,
  ): Transaction {
    const query = this.updateQuery(match, update, mutate, false);
    tx.run(query.cypher, query.parameters);
    return tx;
  }

  async delete(props: Partial<T>): Promise<T[]> {
    return (
      await this._run(this.deleteQuery(props), {
        write: true,
      })
    ).map((r) => this.fromNeo4j(r.deleted));
  }

  deleteInTx(tx: Transaction, props: Partial<T>): Transaction {
    const query = this.deleteQuery(props, false);
    tx.run(query.cypher, query.parameters);
    return tx;
  }

  async findAll(params?: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    return (await this._run(this.findAllQuery(params))).map((r) =>
      this.fromNeo4j(r.matched),
    );
  }

  async findBy(params: {
    props: Partial<T>;
    skip?: number;
    limit?: number;
    orderBy?: string;
    descending?: boolean;
  }): Promise<T[]> {
    return (await this._run(this.findByQuery(params))).map((r) =>
      this.fromNeo4j(r.matched),
    );
  }

  async searchBy(params: {
    prop: keyof T;
    terms: string[];
    skip?: number;
    limit?: number;
  }): Promise<[T, number][]> {
    return (await this._run(this.searchByQuery(params))).map((r) => {
      return [this.fromNeo4j(r.matched), r.score.toInt()];
    });
  }
}
