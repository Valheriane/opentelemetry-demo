import { createServer } from 'node:http';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { createYoga } from 'graphql-yoga';

import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

const PORT = Number(process.env.PORT || 4004);

const schema = buildSubgraphSchema({
  typeDefs,
  resolvers
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  maskedErrors: false
});

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'shipping-dgs' }));
    return;
  }

  yoga(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`shipping-dgs ready on http://localhost:${PORT}/graphql`);
  console.log(`shipping backend target: ${process.env.SHIPPING_ADDR || 'http://shipping:50050'}`);
});