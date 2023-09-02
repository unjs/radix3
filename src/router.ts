import type {
  RadixRouterContext,
  RadixNode,
  MatchedRoute,
  RadixRouter,
  RadixNodeData,
  RadixRouterOptions,
  LookupOptions,
  InsertOptions,
  StaticRoutesMap,
} from "./types";
import { HTTPMethods, NODE_TYPES } from "./types";

export function createRouter<T extends RadixNodeData = RadixNodeData>(
  options: RadixRouterOptions = {}
): RadixRouter<T> {
  const ctx: RadixRouterContext = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: Object.fromEntries(
      HTTPMethods.map((method) => [method, {}])
    ) as StaticRoutesMap,
  };

  const normalizePath = (p: string) =>
    options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";

  const getInsertOptions = (p: string) =>
    "method" in options
      ? {
          path: normalizePath(p),
          payload: options.routes[p].payload,
          method: options.routes[p].method,
        }
      : {
          path: normalizePath(p),
          payload: options.routes[p],
        };

  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, getInsertOptions(path));
    }
  }

  const insertRoute = (pathOrObj: string | InsertOptions<T>, data?: T) => {
    const isStr = typeof pathOrObj === "string";
    return insert(ctx, {
      path: normalizePath(isStr ? pathOrObj : pathOrObj.path),
      payload: isStr ? data : pathOrObj.payload,
      method: isStr ? undefined : pathOrObj.method,
    });
  };

  return {
    ctx,
    // @ts-expect-error - types are not matching
    lookup: (path: string, options?: LookupOptions) =>
      lookup(ctx, normalizePath(path), options),
    insert: insertRoute,
    remove: (path: string) => remove(ctx, normalizePath(path)),
  };
}

function lookup(
  ctx: RadixRouterContext,
  path: string,
  options?: LookupOptions
): MatchedRoute {
  const method = options?.method;

  const staticPathNode = ctx.staticRoutesMap[method ?? "ALL"][path];
  if (staticPathNode) {
    return staticPathNode.data;
  }

  const sections = path.split("/");

  const params: MatchedRoute["params"] = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }

    // Exact matches take precedence over placeholders
    const nextNode = node.children.get(section);
    if (nextNode !== undefined) {
      node = nextNode;
    } else {
      node = node.placeholderChildNode;
      if (node !== null) {
        params[node.paramName] = section;
        paramsFound = true;
      } else {
        break;
      }
    }
  }

  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }

  if (!node) {
    return null;
  }

  if (method && node.method !== method) {
    return null;
  }

  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : undefined,
    };
  }

  return node.data;
}

function insert<T>(ctx: RadixRouterContext, options: InsertOptions<T>) {
  const { path, payload: data, method = undefined } = options;

  let isStaticRoute = true;

  const sections = path.split("/");

  let node = ctx.rootNode;

  let _unnamedPlaceholderCtr = 0;

  for (const section of sections) {
    let childNode: RadixNode<RadixNodeData>;

    if ((childNode = node.children.get(section))) {
      node = childNode;
    } else {
      const type = getNodeType(section);

      // Create new node to represent the next part of the path
      childNode = createRadixNode({ type, parent: node, method });

      node.children.set(section, childNode);

      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName =
          section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildNode = childNode;
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(3 /* "**:" */) || "_";
        isStaticRoute = false;
      }

      node = childNode;
    }
  }

  // Store whatever data was provided into the node
  node.data = data;

  // Optimization, if a route is static and does not have any
  // variable sections, we can store it into a map for faster retrievals
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[method || "ALL"][path] = node;
  }

  return node;
}

function remove(ctx: RadixRouterContext, path: string) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;

  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }

  if (node.data) {
    const lastSection = sections[sections.length - 1];
    node.data = null;
    if (Object.keys(node.children).length === 0) {
      const parentNode = node.parent;
      parentNode.children.delete(lastSection);
      parentNode.wildcardChildNode = null;
      parentNode.placeholderChildNode = null;
    }
    success = true;
  }

  return success;
}

function createRadixNode(options: Partial<RadixNode> = {}): RadixNode {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    parent: options.parent || null,
    children: new Map(),
    data: options.data || null,
    method: options.method || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildNode: null,
  };
}

function getNodeType(str: string) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}
