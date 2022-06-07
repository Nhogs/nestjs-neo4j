import { ConstraintOptions } from '../decorator';
import { createCypherConstraint, generateCommonName } from '../common';

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

  private _cypherConstraints: Map<string, string[]> = new Map<
    string,
    string[]
  >();

  private static _generateConstraintName(
    c: ConstraintPropertyMetadata,
    metadata: ConstraintClassMetadata,
  ) {
    let name: string;

    if (c.options?.name) {
      name = c.options.name;
    } else if (c.options?.useCommonName) {
      name = generateCommonName(metadata.name, c.property, c.constraintType);
    }
    return name;
  }

  private _addCypherConstraint(
    name: string,
    constraintClassMetadata: ConstraintClassMetadata,
    constraintPropertyMetadata: ConstraintPropertyMetadata,
  ) {
    this._cypherConstraints
      .get(constraintClassMetadata.name)
      .push(
        createCypherConstraint(
          name,
          constraintPropertyMetadata.options?.ifNotExists,
          constraintClassMetadata.isRel,
          constraintClassMetadata.name,
          [constraintPropertyMetadata.property].concat(
            constraintPropertyMetadata.options?.additionalKeys
              ? constraintPropertyMetadata.options?.additionalKeys
              : [],
          ),
          constraintPropertyMetadata.constraintType,
        ),
      );
  }

  addConstraintPropertyMetadata(metadata: ConstraintPropertyMetadata) {
    this._constraintMetadata.push(metadata);
  }

  addConstraintClassMetadata(constraintClassMetadata: ConstraintClassMetadata) {
    const constraints = this._constraintMetadata.filter(
      (c) => c.target === constraintClassMetadata.target,
    );

    if (constraints.length > 0) {
      if (!this._cypherConstraints.has(constraintClassMetadata.name)) {
        this._cypherConstraints.set(constraintClassMetadata.name, []);
      }

      constraints.forEach(
        (constraintPropertyMetadata: ConstraintPropertyMetadata) => {
          let name = Neo4jMetadataStorageDef._generateConstraintName(
            constraintPropertyMetadata,
            constraintClassMetadata,
          );
          this._addCypherConstraint(
            name,
            constraintClassMetadata,
            constraintPropertyMetadata,
          );
        },
      );
    }
  }

  getCypherConstraints(label?: string) {
    if (label) {
      return this._cypherConstraints.get(label);
    } else {
      return ([] as string[]).concat(
        ...Array.from(this._cypherConstraints.values()),
      );
    }
  }
}

const globalRef = global as any;
export const Neo4jMetadataStorage: Neo4jMetadataStorageDef =
  globalRef.Neo4jMetadataStorage ||
  (globalRef.Neo4jMetadataStorage = new Neo4jMetadataStorageDef());
