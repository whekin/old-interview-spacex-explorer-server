const SQL = require('sequelize');

module.exports.paginateResults = ({
  after: cursor,
  pageSize = 20,
  results,
  from,
  to,
  // can pass in a function to calculate an item's cursor
  getCursor = () => null,
}) => {
  if (pageSize < 1) return [];
  
  if (from) results = results.filter((launch) => new Date(launch.date) > from);
  if (to) results = results.filter((launch) => new Date(launch.date) < to);

  if (!cursor) return results.slice(0, pageSize);
  const cursorIndex = results.findIndex(item => {
    // if an item has a `cursor` on it, use that, otherwise try to generate one
    let itemCursor = item.cursor ? item.cursor : getCursor(item);

    // if there's still not a cursor, return false by default
    return itemCursor ? cursor === itemCursor : false;
  });

  return cursorIndex >= 0
    ? cursorIndex === results.length - 1 // don't let us overflow
      ? []
      : results.slice(
        cursorIndex + 1,
        Math.min(results.length, cursorIndex + 1 + pageSize),
      )
    : results.slice(0, pageSize);
};

module.exports.createStore = () => {
  const Op = SQL.Op;
  const operatorsAliases = {
    $in: Op.in,
  };

  const db = new SQL('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: './store.sqlite',
    operatorsAliases,
    logging: false,
  });

  const users = db.define('user', {
    id: {
      type: SQL.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    createdAt: SQL.DATE,
    updatedAt: SQL.DATE,
    email: SQL.STRING,
    token: SQL.STRING,
  });

  const trips = db.define('trip', {
    id: {
      type: SQL.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    createdAt: SQL.DATE,
    updatedAt: SQL.DATE,
    launchId: SQL.INTEGER,
    userId: SQL.INTEGER,
  });

  const launches = db.define('launch', {
    id: {
      type: SQL.INTEGER,
      primaryKey: true,
    },
    createdAt: SQL.DATE,
    updatedAt: SQL.DATE,
    cartId: SQL.INTEGER,
  });

  const carts = db.define('cart', {
    id: {
      type: SQL.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: SQL.INTEGER,
    isShared: SQL.BOOLEAN,
    createdAt: SQL.DATE,
    updatedAt: SQL.DATE,
  });

  const cartsLaunches = db.define('cartLaunch', {
    id: {
      type: SQL.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    createdAt: SQL.DATE,
    updatedAt: SQL.DATE,
    launchId: SQL.INTEGER,
    cartId: SQL.INTEGER,
  });

  users.hasMany(trips);
  carts.belongsTo(users, { foreignKey: 'userId', as: 'user' });
  carts.belongsToMany(launches, { through: 'cartLaunch', foreignKey: 'cartId' });
  launches.belongsToMany(carts, { through: 'cartLaunch', foreignKey: 'launchId' });

  db.sync();

  return { users, trips, carts, launches, cartsLaunches };
};
