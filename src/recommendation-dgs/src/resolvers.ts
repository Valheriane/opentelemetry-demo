import { ChannelCredentials, type ServiceError } from "@grpc/grpc-js";
import {
  RecommendationServiceClient,
  type ListRecommendationsResponse
} from "./protos/demo.js";

const { RECOMMENDATION_ADDR = "recommendation:9001" } = process.env;

const client = new RecommendationServiceClient(
  RECOMMENDATION_ADDR,
  ChannelCredentials.createInsecure()
);

type RecommendationArgs = {
  userId: string;
  productIds: string[];
  limit?: number | null;
};

const listRecommendationIds = (
  userId: string,
  productIds: string[]
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    client.listRecommendations(
      { userId, productIds },
      (error: ServiceError | null, response: ListRecommendationsResponse) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response.productIds);
      }
    );
  });
};

const applyLimit = (productIds: string[], limit?: number | null): string[] => {
  const safeLimit = limit ?? 4;
  return productIds.slice(0, Math.max(0, safeLimit));
};

export const resolvers = {
  Query: {
    recommendedProductIds: async (
      _parent: unknown,
      args: RecommendationArgs
    ): Promise<string[]> => {
      const productIds = await listRecommendationIds(args.userId, args.productIds);
      return applyLimit(productIds, args.limit);
    },

    recommendedProducts: async (
      _parent: unknown,
      args: RecommendationArgs
    ) => {
      const productIds = await listRecommendationIds(args.userId, args.productIds);
      return applyLimit(productIds, args.limit).map((id) => ({
        __typename: "Product",
        id
      }));
    }
  }
};
