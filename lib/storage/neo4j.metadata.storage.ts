import { ConstraintOptions } from '../decorator';
import { createCypherConstraint, generateExplicitName } from '../common';

export interface PropertyConstraintMetadata {
  target: Function;
  property: string;
  constraintType: string;
  options: ConstraintOptions;
}

export interface NodeClassMetadata {
  target: Function;
  label: string;
}

export interface RelationshipClassMetadata {
  target: Function;
  type: string;
}

/**
 * Decorator Evaluation.
 * There is a well defined order to how decorators applied to various declarations inside of a class are applied:
 *
 * Parameter Decorators, followed by Method, Accessor, or Property Decorators are applied for each instance member.
 * Parameter Decorators, followed by Method, Accessor, or Property Decorators are applied for each static member.
 * Parameter Decorators are applied for the constructor.
 * Class Decorators are applied for the class.
 */
export class Neo4jMetadataStorageDef {
  private _nodes: NodeClassMetadata[] = [];
  private _relationships: RelationshipClassMetadata[] = [];
  private _constraints: PropertyConstraintMetadata[] = [];

  private _cypherConstraints: Map<string, string[]> = new Map<
    string,
    string[]
  >();

  private static _generateConstraintName(
    c: PropertyConstraintMetadata,
    nodeOrRelationName: string,
  ) {
    let name: string;

    if (c.options?.name) {
      name = c.options.name;
    } else if (c.options?.useCommonName) {
      name = generateExplicitName(
        nodeOrRelationName,
        c.property,
        c.constraintType,
      );
    }
    return name;
  }

  private _addCypherConstraint(
    name: string,
    label: string,
    isRel: boolean,
    constraintPropertyMetadata: PropertyConstraintMetadata,
  ) {
    this._cypherConstraints
      .get(label)
      .push(
        createCypherConstraint(
          name,
          constraintPropertyMetadata.options?.ifNotExists,
          isRel,
          label,
          [constraintPropertyMetadata.property].concat(
            constraintPropertyMetadata.options?.additionalKeys
              ? constraintPropertyMetadata.options?.additionalKeys
              : [],
          ),
          constraintPropertyMetadata.constraintType,
        ),
      );
  }

  addPropertyConstraint(metadata: PropertyConstraintMetadata) {
    this._constraints.push(metadata);
  }

  addNodeClassDecorator(param: NodeClassMetadata) {
    this._nodes.push(param);
    this.generateCypherConstraints({
      target: param.target,
      label: param.label,
      isRel: false,
    });
  }

  addRelationClassDecorator(param: RelationshipClassMetadata) {
    this._relationships.push(param);
    this.generateCypherConstraints({
      target: param.target,
      label: param.type,
      isRel: true,
    });
  }

  generateCypherConstraints(param: {
    target: Function;
    label: string;
    isRel: boolean;
  }) {
    const sameTargetConstraints = this._constraints.filter(
      (c) => c.target === param.target,
    );

    if (sameTargetConstraints.length > 0) {
      if (!this._cypherConstraints.has(param.label)) {
        this._cypherConstraints.set(param.label, []);
      }

      sameTargetConstraints.forEach(
        (constraintPropertyMetadata: PropertyConstraintMetadata) => {
          let constraintName = Neo4jMetadataStorageDef._generateConstraintName(
            constraintPropertyMetadata,
            param.label,
          );
          this._addCypherConstraint(
            constraintName,
            param.label,
            param.isRel,
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
