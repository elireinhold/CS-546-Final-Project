import { MongoClient } from "mongodb";
import { settings } from "./settings.js";

const mongoConfig = settings.mongoConfig;

let _connection = undefined;
let _db = undefined;

export const dbConnection = async () => {
  if (!_connection) {
    _connection = new MongoClient(mongoConfig.serverUrl);
    await _connection.connect();
    _db = _connection.db(mongoConfig.database);
  }
  return _db;
};
