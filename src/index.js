import { ApolloServer } from 'apollo-server';
import typeDefs from './schema';
import { createStore } from './utils';
import resolvers from './resolvers';

import LaunchAPI from './datasources/launch';
import UserAPI from './datasources/user';

const store = createStore();

const dataSources = () => ({
  launchAPI: new LaunchAPI(),
  userAPI: new UserAPI({ store }),
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
