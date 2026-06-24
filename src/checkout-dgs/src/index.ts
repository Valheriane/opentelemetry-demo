import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { buildSubgraphSchema } from "@apollo/subgraph";

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";

const port = Number(process.env.PORT ?? 4011);

const app = express();

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }])
});

await server.start();

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "checkout-dgs"
  });
});

app.use("/", cors(), express.json(), expressMiddleware(server));

app.listen(port, () => {
  console.log(`checkout-dgs ready on http://localhost:${port}/`);
});
