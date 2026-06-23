
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";

const PORT = Number(process.env.PORT ?? 4000);

const SHIPPING_DGS_URL =
  process.env.SHIPPING_DGS_URL ?? "http://shipping-dgs:4004/graphql";

const PRODUCT_CATALOG_DGS_URL =
  process.env.PRODUCT_CATALOG_DGS_URL ?? "http://product-catalog-dgs:4005/graphql";

const CURRENCY_DGS_URL =
  process.env.CURRENCY_DGS_URL ?? "http://currency-dgs:4006/graphql";

const CART_DGS_URL =
  process.env.CART_DGS_URL ?? "http://cart-dgs:4007/graphql";

const RECOMMENDATION_DGS_URL =
  process.env.RECOMMENDATION_DGS_URL ?? "http://recommendation-dgs:4008/graphql";

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      {
        name: "shipping",
        url: SHIPPING_DGS_URL
      },
      {
        name: "productCatalog",
        url: PRODUCT_CATALOG_DGS_URL
      },
      {
        name: "currency",
        url: CURRENCY_DGS_URL
      },
      {
        name: "cart",
        url: CART_DGS_URL
      },
      {
        name: "recommendation",
        url: RECOMMENDATION_DGS_URL
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
console.log(`Composed subgraph: productCatalog -> ${PRODUCT_CATALOG_DGS_URL}`);
console.log(`Composed subgraph: currency -> ${CURRENCY_DGS_URL}`);
console.log(`Composed subgraph: cart -> ${CART_DGS_URL}`);
console.log(`Composed subgraph: recommendation -> ${RECOMMENDATION_DGS_URL}`);