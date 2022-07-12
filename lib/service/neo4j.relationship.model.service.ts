import { Neo4jModelService } from './neo4j.model.service';
import { Neo4jNodeModelService } from './neo4j.node.model.service';
import { NODE, TIMESTAMP } from '../common';
import { Transaction } from 'neo4j-driver';

/**
 * Helper class to generate relationship model service using Neo4j
 */
export abstract class Neo4jRelationshipModelService<
  R,
> extends Neo4jModelService<R> {
  create<F, T>(
    props: Partial<R>,
    fromProps: Partial<F>,
    toProps: Partial<T>,
    fromService: Neo4jNodeModelService<F>,
    toService: Neo4jNodeModelService<T>,
    options: { merge?: boolean; returns?: boolean } = {
      merge: false,
      returns: true,
    },
  ) {
    const p = this.toNeo4j(props);
    const fp = fromService.toNeo4j(fromProps);
    const tp = toService.toNeo4j(toProps);

    const MATCH = `MATCH ${NODE('f', fromService.label)}, ${NODE(
      't',
      toService.label,
    )}`;

    const WHERE_CLAUSES = [
      ...Object.keys(fp).map((k) => `f.\`${k}\` = $fp.\`${k}\``),
      ...Object.keys(tp).map((k) => `t.\`${k}\` = $tp.\`${k}\``),
    ].join(' AND ');

    const WHERE = `${WHERE_CLAUSES ? ` WHERE ${WHERE_CLAUSES}` : ''}`;

    const CREATE = `${options?.merge ? ' MERGE' : ' CREATE'} (f)-[r:\`${
      this.label
    }\`]->(t)`;

    const SET = `${p || this.timestamp ? ` SET` : ''}${
      p ? ` r=$p` : ''
    }${TIMESTAMP('r', this.timestamp, p ? ', ' : ' ')}`;

    const RETURN = `${
      options.returns
        ? ` RETURN properties (f) AS from, properties(r) AS created, properties(t) AS to`
        : ''
    }`;

    const query = {
      cypher: `${MATCH}${WHERE}${CREATE}${SET}${RETURN}`,
      parameters: { p, fp, tp },
    };
    return {
      query,
      runTx: (tx: Transaction) => tx.run(query.cypher, query.parameters),
      run: async () => {
        const res = await this._run(query, { write: true });
        return res.map((r) => {
          return [
            fromService.fromNeo4j(r.from),
            this.fromNeo4j(r.merged),
            toService.fromNeo4j(r.to),
          ] as [F, R, T];
        });
      },
    };
  }
}
