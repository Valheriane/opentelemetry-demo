import { ChannelCredentials } from "@grpc/grpc-js";
import { ProductCatalogServiceClient } from "./protos/demo.js";
import type { Product } from "./protos/demo.js";

const { PRODUCT_CATALOG_ADDR = "product-catalog:3550" } = process.env;

const client = new ProductCatalogServiceClient(
  PRODUCT_CATALOG_ADDR,
  ChannelCredentials.createInsecure()
);

function listProductsGrpc(): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    client.listProducts({}, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response.products ?? []);
    });
  });
}

function getProductGrpc(id: string): Promise<Product> {
  return new Promise((resolve, reject) => {
    client.getProduct({ id }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

function mapProduct(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    picture: product.picture,
    priceUsd: {
      currencyCode: product.priceUsd?.currencyCode ?? "USD",
      units: product.priceUsd?.units ?? 0,
      nanos: product.priceUsd?.nanos ?? 0
    },
    categories: product.categories ?? []
  };
}

export const resolvers = {
  Query: {
    products: async () => {
      const products = await listProductsGrpc();
      return products.map(mapProduct);
    },

    product: async (_parent: unknown, args: { id: string }) => {
      const product = await getProductGrpc(args.id);
      return mapProduct(product);
    }
  },

  Product: {
    __resolveReference: async (reference: { id: string }) => {
      const product = await getProductGrpc(reference.id);
      return mapProduct(product);
    }
  }
};
