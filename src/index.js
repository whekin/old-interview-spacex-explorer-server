import { ApolloServer } from 'apollo-server';
import typeDefs from './schema';
import { createStore } from './utils';
import resolvers from './resolvers';

import LaunchAPI from './datasources/launch';
import UserAPI from './datasources/user';

import isEmail from 'isemail';

import dotenv from 'dotenv';

dotenv.config();

const store = createStore();

const dataSources = () => ({
  launchAPI: new LaunchAPI(),
  userAPI: new UserAPI({ store }),
});

const context = async ({ req }) => {
  const auth = req.headers && req.headers.authorization || '';
  const email = Buffer.from(auth, 'base64').toString('ascii');
  
  if (!isEmail.validate(email)) return { user: null };

  const users = await store.users.findOrCreate({ where: { email } });
  const user = users && users[0] || null;

  return { user: { ...user.dataValues } };
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

export default {
  dataSources,
  context,
  typeDefs,
  resolvers,
  ApolloServer,
  LaunchAPI,
  UserAPI,
  store,
  server,
};
