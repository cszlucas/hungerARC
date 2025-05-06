const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
jest.setTimeout(15000);
let mongoServer;
// const { piscina } = require('../../simulation/main');

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

  // if (piscina) {
  //   await piscina.destroy();  // Ensure all worker threads are destroyed
  // }

  // Clean up Express server
  // if (mongoServer) {
  //   mongoServer.close();  // Close the server if it's still running
  // }

  // if (messagePort) {
  //   messagePort.close();  // Close MessagePort if you're using it
  // }

});
