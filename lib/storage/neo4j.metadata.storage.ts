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

  private _cypherConstraints: Map<string, string[]> = new Map<
    string,
    string[]
  >();

  private static _generateCommonName(
    name: string,
    property: string,
    constraintType: string,
  ): string {
    let type: string;

    if (constraintType === 'IS NODE KEY') {
      type = 'key';
    }
    if (constraintType === 'IS UNIQUE') {
      type = 'unique';
    }
    if (constraintType === 'IS NOT NULL') {
      type = 'exists';
    }

    return `${name.toLowerCase()}_${property.toLowerCase()}_${type}`;
  }

  addConstraintPropertyMetadata(metadata: ConstraintPropertyMetadata) {
    this._constraintMetadata.push(metadata);
  }

  addConstraintClassMetadata(metadata: ConstraintClassMetadata) {
    const constraints = this._constraintMetadata.filter(
      (c) => c.target === metadata.target,
    );

    if (constraints.length > 0) {
      if (!this._cypherConstraints.has(metadata.name)) {
        this._cypherConstraints.set(metadata.name, []);
      }

      constraints.forEach((c) => {
        let name: string;

        if (c.options?.name) {
          name = c.options.name;
        } else if (c.options?.useCommonName) {
          name = Neo4jMetadataStorageDef._generateCommonName(
            metadata.name,
            c.property,
            c.constraintType,
          );
        }

        this._cypherConstraints
          .get(metadata.name)
          .push(
            createCypherConstraint(
              name,
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
