// const request = require("supertest");
// const mongoose = require("mongoose");
// const { MongoMemoryServer } = require("mongodb-memory-server");
// const app = require("../app"); // Import your Express app
// const Tax = require("../models/tax"); // Your Tax model

// let mongoServer;

// // Setup an in-memory MongoDB instance
// beforeAll(async () => {
//   mongoServer = await MongoMemoryServer.create();
//   const uri = mongoServer.getUri();
//   await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// });

// afterAll(async () => {
//   await mongoose.connection.dropDatabase();
//   await mongoose.connection.close();
//   await mongoServer.stop();
// });

// describe("Tax Routes Tests", () => {
//   test("Should scrape and save standard deductions", async () => {
//     const res = await request(app).get("/standardDeductions"); // Replace with your actual endpoint
//     expect(res.status).toBe(200);

//     // Fetch the saved document from the test database
//     const taxDoc = await Tax.findOne();
//     expect(taxDoc).toBeDefined();
//     expect(taxDoc.single.standardDeductions).toBeGreaterThan(0);
//     expect(taxDoc.married.standardDeductions).toBeGreaterThan(0);
//   });

//   test("Should scrape and save federal income tax brackets", async () => {
//     const res = await request(app).get("/api/incomeSingle"); // Replace with your actual endpoint
//     expect(res.status).toBe(200);

//     // Fetch the saved document
//     const taxDoc = await Tax.findOne();
//     expect(taxDoc).toBeDefined();
//     expect(taxDoc.single.federalIncomeTaxRatesBrackets.length).toBeGreaterThan(0);

//     // Ensure data format is correct
//     taxDoc.single.federalIncomeTaxRatesBrackets.forEach((bracket) => {
//       expect(bracket.incomeRange.length).toBe(2);
//       expect(typeof bracket.taxRate).toBe("number");
//     });
//   });
// });
