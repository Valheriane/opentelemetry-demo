
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";

const PORT = Number(process.env.PORT ?? 4000);

const SHIPPING_DGS_URL =
  process.env.SHIPPING_DGS_URL ?? "http://shipping-dgs:4004/graphql";

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      {
        name: "shipping",
        url: SHIPPING_DGS_URL
      }
    ]
  })
});

const server = new ApolloServer({
  gateway
});

const { url } = await startStandaloneServer(server, {
  listen: {
    port: PORT
  }
});

console.log(`GraphQL Gateway ready at ${url}`);
console.log(`Composed subgraph: shipping -> ${SHIPPING_DGS_URL}`);
