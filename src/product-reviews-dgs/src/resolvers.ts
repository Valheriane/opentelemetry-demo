import { ChannelCredentials } from "@grpc/grpc-js";
import {
  ProductReviewServiceClient,
  type ProductReview as ProtoProductReview
} from "./protos/demo.js";

const { PRODUCT_REVIEWS_ADDR = "product-reviews:3551" } = process.env;

const client = new ProductReviewServiceClient(
  PRODUCT_REVIEWS_ADDR,
  ChannelCredentials.createInsecure()
);

type ProductParent = {
  id: string;
};

type ProductReview = {
  username: string;
  description: string;
  score: string;
};

const mapReview = (review: ProtoProductReview): ProductReview => ({
  username: review.username,
  description: review.description,
  score: review.score
});

const getProductReviews = (productId: string): Promise<ProductReview[]> => {
  return new Promise((resolve, reject) => {
    client.getProductReviews({ productId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response.productReviews.map(mapReview));
    });
  });
};

const getAverageProductReviewScore = (productId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.getAverageProductReviewScore({ productId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response.averageScore);
    });
  });
};

const askProductAiAssistant = (
  productId: string,
  question: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.askProductAiAssistant({ productId, question }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response.response);
    });
  });
};

export const resolvers = {
  Query: {
    productReviews: async (
      _parent: unknown,
      args: { productId: string }
    ): Promise<ProductReview[]> => {
      return getProductReviews(args.productId);
    },

    averageProductReviewScore: async (
      _parent: unknown,
      args: { productId: string }
    ): Promise<string> => {
      return getAverageProductReviewScore(args.productId);
    },

    askProductAiAssistant: async (
      _parent: unknown,
      args: { productId: string; question: string }
    ): Promise<string> => {
      return askProductAiAssistant(args.productId, args.question);
    }
  },

  Product: {
    reviews: async (parent: ProductParent): Promise<ProductReview[]> => {
      return getProductReviews(parent.id);
    },

    averageReviewScore: async (parent: ProductParent): Promise<string> => {
      return getAverageProductReviewScore(parent.id);
    },

    askAiAssistant: async (
      parent: ProductParent,
      args: { question: string }
    ): Promise<string> => {
      return askProductAiAssistant(parent.id, args.question);
    }
  }
};
