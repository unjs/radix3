import { describe, it, expect } from "vitest";
import {
  createRouter,
  NODE_TYPES,
  type HTTPMethod,
  type RadixRouterOptions,
} from "../src";

type RouteDefinition = string | { path: string; method: HTTPMethod };
export function createRoutes(paths: RouteDefinition[]) {
  return Object.fromEntries(
    paths.map((path) => {
      return typeof path === "string"
        ? [path, { path }]
        : [path.path, { method: path.method, payload: { path: path.path } }];
    })
  ) as Required<Pick<RadixRouterOptions, "routes">>["routes"];
}

function testRouter(paths: string[], tests?: any) {
  const routes = createRoutes(paths);
  const router = createRouter({ routes });

  if (!tests) {
    tests = routes;
  }

  for (const path in tests) {
    it(`lookup ${path} should be ${JSON.stringify(tests[path])}`, () => {
      expect(router.lookup(path)).to.deep.equal(tests[path]);
    });
  }
}

describe("Router lookup", function () {
  describe("static routes", function () {
    testRouter([
      "/",
      "/route",
      "/another-router",
      "/this/is/yet/another/route",
    ]);
  });

  describe("retrieve placeholders", function () {
    testRouter(
      [
        "carbon/:element",
        "carbon/:element/test/:testing",
        "this/:route/has/:cool/stuff",
      ],
      {
        "carbon/test1": {
          path: "carbon/:element",
          params: {
            element: "test1",
          },
        },
        "/carbon": null,
        "carbon/": null,
        "carbon/test2/test/test23": {
          path: "carbon/:element/test/:testing",
          params: {
            element: "test2",
            testing: "test23",
          },
        },
        "this/test/has/more/stuff": {
          path: "this/:route/has/:cool/stuff",
          params: {
            route: "test",
            cool: "more",
          },
        },
      }
    );
  });

  describe("should be able to perform wildcard lookups", function () {
    testRouter(
      ["polymer/**:id", "polymer/another/route", "route/:p1/something/**:rest"],
      {
        "polymer/another/route": { path: "polymer/another/route" },
        "polymer/anon": { path: "polymer/**:id", params: { id: "anon" } },
        "polymer/foo/bar/baz": {
          path: "polymer/**:id",
          params: { id: "foo/bar/baz" },
        },
        "route/param1/something/c/d": {
          path: "route/:p1/something/**:rest",
          params: { p1: "param1", rest: "c/d" },
        },
      }
    );
  });

  describe("unnamed placeholders", function () {
    testRouter(["polymer/**", "polymer/route/*"], {
      "polymer/foo/bar": { path: "polymer/**", params: { _: "foo/bar" } },
      "polymer/route/anon": { path: "polymer/route/*", params: { _0: "anon" } },
      "polymer/constructor": {
        path: "polymer/**",
        params: { _: "constructor" },
      },
    });
  });

  describe("should be able to match routes with trailing slash", function () {
    testRouter(["route/without/trailing/slash", "route/with/trailing/slash/"], {
      "route/without/trailing/slash": { path: "route/without/trailing/slash" },
      "route/with/trailing/slash/": { path: "route/with/trailing/slash/" },
      "route/without/trailing/slash/": { path: "route/without/trailing/slash" },
      "route/with/trailing/slash": { path: "route/with/trailing/slash/" },
    });
  });
});

describe("Router insert", function () {
  it("should be able to insert nodes correctly into the tree", function () {
    const router = createRouter();
    router.insert("hello", {});
    router.insert("cool", {});
    router.insert("hi", {});
    router.insert("helium", {});
    router.insert("/choo", {});
    router.insert("//choo", {});

    const rootNode = router.ctx.rootNode;
    const helloNode = rootNode.children.get("hello");
    const coolNode = rootNode.children.get("cool");
    const hiNode = rootNode.children.get("hi");
    const heliumNode = rootNode.children.get("helium");
    const slashNode = rootNode.children.get("");

    expect(helloNode).to.exist;
    expect(coolNode).to.exist;
    expect(hiNode).to.exist;
    expect(heliumNode).to.exist;
    expect(slashNode).to.exist;

    const slashChooNode = slashNode!.children.get("choo");
    const slashSlashChooNode = slashNode!.children
      .get("")!
      .children.get("choo");

    expect(slashChooNode).to.exist;
    expect(slashSlashChooNode).to.exist;
  });

  it("should insert static routes into the static route map", function () {
    const router = createRouter();
    const route = "/api/v2/route";
    router.insert(route, {});

    expect(router.ctx.staticRoutesMap.ALL[route]).to.exist;
  });

  it("should insert static routes with methods into the static route map", function () {
    const router = createRouter();
    const route = "/api/v2/route";
    router.insert({ path: route, method: "PUT", payload: {} });

    expect(router.ctx.staticRoutesMap.PUT[route]).to.exist;
  });

  it("should not insert variable routes into the static route map", function () {
    const router = createRouter();
    const routeA = "/api/v2/**";
    const routeB = "/api/v3/:placeholder";
    router.insert(routeA, {});
    router.insert(routeB, {});

    expect(router.ctx.staticRoutesMap.ALL[routeA]).to.not.exist;
    expect(router.ctx.staticRoutesMap.ALL[routeB]).to.not.exist;
  });

  it("should insert placeholder and wildcard nodes correctly into the tree", function () {
    const router = createRouter();
    router.insert("hello/:placeholder/tree", {});
    router.insert("choot/choo/**", {});

    const helloNode = router.ctx.rootNode.children.get("hello");
    const helloPlaceholderNode = helloNode!.children.get(":placeholder");
    expect(helloPlaceholderNode!.type).to.equal(NODE_TYPES.PLACEHOLDER);

    const chootNode = router.ctx.rootNode.children.get("choot");
    const chootChooNode = chootNode!.children.get("choo");
    const chootChooWildcardNode = chootChooNode!.children.get("**");
    expect(chootChooWildcardNode!.type).to.equal(NODE_TYPES.WILDCARD);
  });

  it("should be able to initialize routes via the router contructor", function () {
    const router = createRouter({
      routes: {
        "/api/v1": { value: 1 },
        "/api/v2": { value: 2 },
        "/api/v3": { value: 3 },
      },
    });

    const rootSlashNode = router.ctx.rootNode.children.get("");
    const apiNode = rootSlashNode!.children.get("api");
    const v1Node = apiNode!.children.get("v1");
    const v2Node = apiNode!.children.get("v2");
    const v3Node = apiNode!.children.get("v3");

    expect(v1Node).to.exist;
    expect(v2Node).to.exist;
    expect(v3Node).to.exist;
    expect(v1Node!.data!.value).to.equal(1);
    expect(v2Node!.data!.value).to.equal(2);
    expect(v3Node!.data!.value).to.equal(3);
  });

  it("should allow routes to be overwritten by performing another insert", function () {
    const router = createRouter({
      routes: { "/api/v1": { data: 1 } },
    });

    let apiRouteData = router.lookup("/api/v1");
    expect(apiRouteData!.data).to.equal(1);

    router.insert("/api/v1", {
      path: "/api/v1",
      data: 2,
      anotherField: 3,
    });

    apiRouteData = router.lookup("/api/v1");
    expect(apiRouteData).deep.equal({
      data: 2,
      path: "/api/v1",
      anotherField: 3,
    });
    expect(apiRouteData!.anotherField).to.equal(3);
  });
});

describe("Router remove", function () {
  it("should be able to remove nodes", function () {
    const router = createRouter({
      routes: createRoutes([
        "hello",
        "cool",
        "hi",
        "helium",
        "coooool",
        "chrome",
        "choot",
        "choot/:choo",
        "ui/**",
        "ui/components/**",
      ]),
    });

    router.remove("choot");
    expect(router.lookup("choot")).to.deep.equal(null);

    expect(router.lookup("ui/components/snackbars")).to.deep.equal({
      path: "ui/components/**",
      params: { _: "snackbars" },
    });

    router.remove("ui/components/**");
    expect(router.lookup("ui/components/snackbars")).to.deep.equal({
      path: "ui/**",
      params: { _: "components/snackbars" },
    });
  });

  it("should be able to remove placeholder routes", function () {
    const router = createRouter({
      routes: createRoutes(["placeholder/:choo", "placeholder/:choo/:choo2"]),
    });

    expect(router.lookup("placeholder/route")).to.deep.equal({
      path: "placeholder/:choo",
      params: {
        choo: "route",
      },
    });

    // TODO
    // router.remove('placeholder/:choo')
    // expect(router.lookup('placeholder/route')).to.deep.equal(null)

    expect(router.lookup("placeholder/route/route2")).to.deep.equal({
      path: "placeholder/:choo/:choo2",
      params: {
        choo: "route",
        choo2: "route2",
      },
    });
  });

  it("should be able to remove wildcard routes", function () {
    const router = createRouter({
      routes: createRoutes(["ui/**", "ui/components/**"]),
    });

    expect(router.lookup("ui/components/snackbars")).to.deep.equal({
      path: "ui/components/**",
      params: { _: "snackbars" },
    });
    router.remove("ui/components/**");
    expect(router.lookup("ui/components/snackbars")).to.deep.equal({
      path: "ui/**",
      params: { _: "components/snackbars" },
    });
  });

  it("should return a result signifying that the remove operation was successful or not", function () {
    const router = createRouter({
      routes: createRoutes(["/some/route"]),
    });

    let removeResult = router.remove("/some/route");
    expect(removeResult).to.equal(true);

    removeResult = router.remove("/some/route");
    expect(removeResult).to.equal(false);

    removeResult = router.remove("/some/route/that/never/existed");
    expect(removeResult).to.equal(false);
  });

  describe("Router with method", function () {
    const router = createRouter({
      method: true,
      routes: createRoutes([
        { path: "hello", method: "GET" },
        { path: "ui/components/**", method: "POST" },
        { path: "**", method: "PUT" },
      ]),
    });

    it("can match a route with a method ", function () {
      expect(router.lookup("hello", { method: "POST" })).to.deep.equal(null);
      expect(router.lookup("hello", { method: "GET" })).to.deep.equal({
        path: "hello",
      });
      expect(router.lookup("hello")).to.deep.equal({ path: "hello" });
    });

    it("can insert routes with a method ", function () {
      router.insert({ path: "cool", method: "GET", payload: { path: "cool" } });
      expect(router.lookup("cool", { method: "POST" })).to.deep.equal(null);
      expect(router.lookup("cool", { method: "GET" })).to.deep.equal({
        path: "cool",
      });
      expect(router.lookup("cool")).to.deep.equal({ path: "cool" });
    });

    it("can match a route with parameters and a method ", function () {
      const snacbkars = "ui/components/snackbars";
      expect(router.lookup(snacbkars, { method: "GET" })).to.deep.equal(null);
      expect(router.lookup(snacbkars, { method: "POST" })).to.deep.equal({
        path: "ui/components/**",
        params: { _: "snackbars" },
      });
      expect(router.lookup(snacbkars)).to.deep.equal({
        path: "ui/components/**",
        params: { _: "snackbars" },
      });
    });

    it("can match a wildcard route with a method ", function () {
      expect(router.lookup("**", { method: "DELETE" })).to.deep.equal(null);
      expect(router.lookup("**", { method: "PUT" })).to.deep.equal({
        path: "**",
      });
      expect(router.lookup("**")).to.deep.equal({ path: "**" });
    });
  });
});
