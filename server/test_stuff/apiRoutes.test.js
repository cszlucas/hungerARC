const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const Tax = require("../models/tax");

// afterAll(async () => {
//   await mongoose.disconnect();
// });

// Mock ID for testing - replace with actual ID or create via a setup step
const testId = "660f5dd80f43c3148c52c780"; // Example ObjectId format

describe("API Route Tests", () => {
  test("GET /handleAllRoutes returns 200", async () => {
    const res = await request(app).get("/handleAllRoutes");
    expect(res.statusCode).toBe(200);

    const taxCount = await Tax.countDocuments();
    expect(taxCount).toBeGreaterThan(0);
  });

  test("GET /scenario/:id returns 200 or 404", async () => {
    const res = await request(app).get(`/scenario/${testId}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  test("GET /scenario/:id/investments returns 200 or 404", async () => {
    const res = await request(app).get(`/scenario/${testId}/investments`);
    expect([200, 404]).toContain(res.statusCode);
  });

  test("GET /getRebalanceStrategy/:id returns 200 or 404", async () => {
    const res = await request(app).get(`/getRebalanceStrategy/${testId}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  test("GET /runSimulation returns 200 or 400", async () => {
    const res = await request(app).get("/runSimulation");
    expect([200, 400]).toContain(res.statusCode);
  });

  test('POST /importScenario imports scenario', async () => {
  const res = await request(app).post('/importScenario').send({
    // mock scenario data
    name: 'Test Scenario',
    userId: testId,
    investments: [],
    investmentTypes: [],
    income: [],
    expense: [],
    invest: [],
    rebalance: [],
    scenario: { _id: new mongoose.Types.ObjectId(), name: 'Test Scenario' },
  });

  expect([200, 201]).toContain(res.statusCode);
  expect(res.body).toHaveProperty('message', 'Scenario successfully imported');
});


  test("POST /updateInvestStrategy/:id updates invest strategy", async () => {
    const res = await request(app).post(`/updateInvestStrategy/${testId}`).send({ strategyName: "Aggressive" });
    expect([200, 404]).toContain(res.statusCode);
  });

  test("GET /unknownRoute returns 404", async () => {
    const res = await request(app).get("/doesnotexist");
    expect(res.statusCode).toBe(404);
  });
});
