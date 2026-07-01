import { createServer } from "node:http";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { createYoga } from "graphql-yoga";

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";

const PORT = Number(process.env.PORT ?? 4007);

const schema = buildSubgraphSchema({
  typeDefs,
  resolvers
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql"
});

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "cart-dgs" }));
    return;
  }

  yoga(req, res);
});

server.listen(PORT, () => {
  console.log(`cart-dgs ready on http://localhost:${PORT}/graphql`);
  console.log(`Cart gRPC target: ${process.env.CART_ADDR ?? "cart:7070"}`);
});
