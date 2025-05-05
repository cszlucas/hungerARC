const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
jest.setTimeout(15000);
let mongoServer;

if (process.env.NODE_ENV === "test") {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
