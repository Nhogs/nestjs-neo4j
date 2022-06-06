import { ConstraintOptions } from '../decorator';
import { createCypherConstraint } from '../common';

export interface ConstraintPropertyMetadata {
  target: Function;
  property: string;
  constraintType: string;
  options: ConstraintOptions;
}

export interface ConstraintClassMetadata {
  target: Function;
  name: string;
  isRel?: boolean;
}

export class Neo4jMetadataStorageDef {
  private _constraintMetadata: Array<ConstraintPropertyMetadata> =
    new Array<ConstraintPropertyMetadata>();

  private _cypherConstraints: string[] = [];

  addConstraintPropertyMetadata(metadata: ConstraintPropertyMetadata) {
    this._constraintMetadata.push(metadata);
  }

  addConstraintClassMetadata(metadata: ConstraintClassMetadata) {
    const constraints = this._constraintMetadata.filter(
      (c) => c.target === metadata.target,
    );

    constraints.forEach((c) => {
      this._cypherConstraints.push(
        createCypherConstraint(
          c.options?.name,
          c.options?.ifNotExists,
          metadata.isRel,
          metadata.name,
          [c.property].concat(
            c.options?.additionalKeys ? c.options?.additionalKeys : [],
          ),
          c.constraintType,
        ),
      );
    });
  }

  getCypherConstraints() {
    return this._cypherConstraints;
  }
}

const globalRef = global as any;
export const Neo4jMetadataStorage: Neo4jMetadataStorageDef =
  globalRef.Neo4jMetadataStorage ||
  (globalRef.Neo4jMetadataStorage = new Neo4jMetadataStorageDef());
