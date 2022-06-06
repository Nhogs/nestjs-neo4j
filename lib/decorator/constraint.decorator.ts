import { Neo4jMetadataStorage } from '../storage';

/**
 * https://neo4j.com/docs/cypher-manual/current/constraints/
 *
 * - Unique node property constraints
 * Unique property constraints ensure that property values are unique for all nodes with a specific label. For unique property constraints on multiple properties, the combination of the property values is unique. Unique constraints do not require all nodes to have a unique value for the properties listed—nodes without all properties are not subject to this rule.
 *
 *   CREATE CONSTRAINT FOR (p:Person) REQUIRE p.name IS UNIQUE
 *   CREATE CONSTRAINT uniqueness FOR (p:Person) REQUIRE (p.firstname, p.age) IS UNIQUE
 *
 *
 * - Node property existence constraints
 * Node property existence constraints ensure that a property exists for all nodes with a specific label. Queries that try to create new nodes of the specified label, but without this property, will fail. The same is true for queries that try to remove the mandatory property.
 *
 *   CREATE CONSTRAINT FOR (p:Person) REQUIRE p.name IS NOT NULL
 *   CREATE CONSTRAINT node_exists IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS NOT NULL
 *
 *
 * - Relationship property existence constraints
 * Property existence constraints ensure that a property exists for all relationships with a specific type. All queries that try to create relationships of the specified type, but without this property, will fail. The same is true for queries that try to remove the mandatory property.
 *
 *   CREATE CONSTRAINT FOR ()-[l:LIKED]-() REQUIRE l.when IS NOT NULL
 *   CREATE CONSTRAINT relationship_exists FOR ()-[l:LIKED]-() REQUIRE l.since IS NOT NULL
 *
 *
 * - Node key constraints
 * Node key constraints ensure that, for a given label and set of properties:
 *   All the properties exist on all the nodes with that label.
 *   The combination of the property values is unique.
 *
 *   CREATE CONSTRAINT FOR (p:Person) REQUIRE (p.firstname, p.surname) IS NODE KEY
 *   CREATE CONSTRAINT node_key FOR (p:Person) REQUIRE p.firstname IS NODE KEY
 *
 *
 * Queries attempting to do any of the following will fail:
 *   Create new nodes without all the properties or where the combination of property values is not unique.
 *   Remove one of the mandatory properties.
 *   Update the properties so that the combination of property values is no longer unique.
 */
export type ConstraintOptions = {
  name?: string;
  ifNotExists?: boolean;
  additionalKeys?: string[];
};

export function Constraint(
  constraintType: string,
  options?: ConstraintOptions,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    Neo4jMetadataStorage.addConstraintPropertyMetadata({
      target: target.constructor,
      property: propertyKey.toString(),
      constraintType,
      options,
    });
  };
}

export function ConstraintKey(options?: ConstraintOptions): PropertyDecorator {
  return Constraint('IS NODE KEY', options);
}

export function ConstraintUnique(
  options?: ConstraintOptions,
): PropertyDecorator {
  return Constraint('IS UNIQUE', options);
}

export function ConstraintNotNull(
  options?: ConstraintOptions,
): PropertyDecorator {
  return Constraint('IS NOT NULL', options);
}
