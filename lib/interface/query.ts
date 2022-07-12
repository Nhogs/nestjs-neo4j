export declare type Query<T = any> = {
  cypher: string;
  parameters?: Record<string, any>;
};
