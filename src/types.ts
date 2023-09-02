export const HTTPMethods = [
  "GET",
  "HEAD",
  "PATCH",
  "POST",
  "PUT",
  "DELETE",
  "CONNECT",
  "OPTIONS",
  "TRACE",
  "ALL",
] as const;

export type HTTPMethod = (typeof HTTPMethods)[number];

export const NODE_TYPES = {
  NORMAL: 0 as const,
  WILDCARD: 1 as const,
  PLACEHOLDER: 2 as const,
};

type _NODE_TYPES = typeof NODE_TYPES;
export type NODE_TYPE = _NODE_TYPES[keyof _NODE_TYPES];

type _RadixNodeDataObject = { params?: never; [key: string]: any };
export type RadixNodeData<
  T extends _RadixNodeDataObject = _RadixNodeDataObject
> = T;
export type MatchedRoute<T extends RadixNodeData = RadixNodeData> = Omit<
  T,
  "params"
> & { params?: Record<string, any> };

export interface RadixNode<T extends RadixNodeData = RadixNodeData> {
  type: NODE_TYPE;
  parent: RadixNode<T> | null;
  children: Map<string, RadixNode<T>>;
  data: RadixNodeData | null;
  method: HTTPMethod | null;
  paramName: string | null;
  wildcardChildNode: RadixNode<T> | null;
  placeholderChildNode: RadixNode<T> | null;
}

export type RadixRouterOptionsPayload = Omit<InsertOptions, "path">;

interface RadixRouterOptionsV1 {
  strictTrailingSlash?: boolean;
  routes?: Record<string, unknown>;
}

interface RadixRouterOptionsV2 {
  strictTrailingSlash?: boolean;
  method: boolean;
  routes: Record<string, RadixRouterOptionsPayload>;
}

export type RadixRouterOptions = RadixRouterOptionsV1 | RadixRouterOptionsV2;

export type StaticRoutesMap = Record<HTTPMethod, Record<string, RadixNode>>;
export interface RadixRouterContext<T extends RadixNodeData = RadixNodeData> {
  options: RadixRouterOptions;
  rootNode: RadixNode<T>;
  staticRoutesMap: StaticRoutesMap;
}

export type LookupOptions = { method?: HTTPMethod };
export type InsertOptions<T = unknown> = {
  path: string;
  payload: T;
  method?: HTTPMethod;
};

export interface RadixRouter<T extends RadixNodeData = RadixNodeData> {
  ctx: RadixRouterContext<T>;

  /**
   * Perform lookup of given path in radix tree
   * @param path - the path to search for
   * @param options - lookup options such as method
   *
   * @returns The data that was originally inserted into the tree
   */
  lookup(path: string, options?: LookupOptions): MatchedRoute<T> | null;

  /**
   * Perform an insert into the radix tree
   * @param path - the prefix to match
   * @param data - the associated data to path
   *
   */
  insert(path: string, data: T): void;
  /**
   * Perform an insert into the radix tree
   * @param options - the options to insert
   *
   */
  insert(options: InsertOptions<T>): void;

  /**
   * Perform a remove on the tree
   * @param { string } data.path - the route to match
   *
   * @returns A boolean signifying if the remove was successful or not
   */
  remove(path: string): boolean;
}

export interface MatcherExport {
  dynamic: Map<string, MatcherExport>;
  wildcard: Map<string, { pattern: string }>;
  static: Map<string, { pattern: string }>;
}
