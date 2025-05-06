const request = require("supertest");
// const app = require("../server");
const mongoose = require("mongoose");
const Tax = require("../models/tax");
const User = require("../models/user");
const Scenario= require("../models/scenario");
const createApp = require("../app");
const validObjectId = new mongoose.Types.ObjectId("5f1a051b07ff5f3e5c7d3f2b");
jest.mock('../models/scenario'); // Adjust the path to the model as needed
Scenario.prototype.save = jest.fn().mockResolvedValue({ _id: validObjectId });
// afterAll(async () => {
//   await mongoose.disconnect();
// });

// Mock ID for testing - replace with actual ID or create via a setup step
// const testId = "660f5dd80f43c3148c52c780"; // Example ObjectId format
// let testId;
let testUser, testId, app;
beforeAll(async () => {
  console.log("HELLO");
  // Create a mock user or fsind an existing user from your DB
  testUser = await User.create({
    _id: new mongoose.Types.ObjectId(),
    googleId: "google-id-12345",  // Replace with a valid Google ID or any unique ID
    email: "testuser@example.com",  // User's email address
    guest: false,  // Set this based on whether the user is a guest
    // Optional fields
    scenarios: [],  // You can leave it empty or provide an array of ObjectIds referencing scenarios
    lastLogin: new Date(),  // Optional: automatically sets to current date
    stateYaml: [],
  });

  // Mock the session (or set it up if using session middleware)
  // app.use((req, res, next) => {
  //   req.session = { user: { _id: testUser._id } }; // Mock the session
  //   next();
  // });

  const mockSession = (req, res, next) => {
    req.session = { user: { _id: testUser._id } };
    next();
  };

  app = createApp({ sessionMiddleware: mockSession });
  
  const res = await request(app).post('/basicInfo').send({
      name: "testing2",
      filingStatus: "single",
      birthYearUser: 1927,
      lifeExpectancy: {
          type: "fixed",
          fixedAge: 100
      },
      birthYearSpouse: "",
      lifeExpectancySpouse: {
          type: "fixed",
          fixedAge: 12
      },
      inflationAssumption: {
          type: "fixed",
          fixedRate: 0.02
      },
      irsLimit: 1000,
      stateResident: "New York",
      financialGoal: 1000
    // _id: new mongoose.Types.ObjectId(),
    //   name: "Sapta's first scenario.",
    //   filingStatus: "single",
    //   birthYearUser: 1952,
    //   lifeExpectancy: {
    //     type: "fixed",
    //     fixedAge: 100
    //   },
    //   inflationAssumption: {
    //     type: "fixed",
    //     fixedRate: 10
    //   },
    //   financialGoal: 1000,
    //   stateResident: "New York",
    //   irsLimit: 1000,
    //   birthYearSpouse: 2023,
    //   lifeExpectancySpouse: {
    //     type: "fixed",
    //     fixedAge: 3
    //   }
  });
    
  // Create the scenario and other data
  // const res = await request(app).post('/basicInfo').send({
  //   scenarioData
    // name: 'Test Scenario',
    // userId: user._id,
    // investments: [], // Add sample investment data here
    // investmentTypes: [], // Add sample investment types
    // income: [], // Add sample income
    // expense: [], // Add sample expense data
    // invest: [], // Add invest data
    // rebalance: [], // Add rebalance data
    // scenario: { _id: new mongoose.Types.ObjectId(), name: 'Test Scenario' },
  // });
  
  console.log('Response body:', res.body);
  expect(Scenario.prototype.save).toHaveBeenCalledTimes(1);
  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('_id'); // Make sure it returns the ID

  testId = res.body._id; // Store for use in later tests
  expect(mongoose.Types.ObjectId.isValid(testId)).toBe(true);  // You can also use the returned `testId` here
  console.log("AFTER");
  process.stdout.write('force flush\n');
  // console.log("testId", testId);
});



describe("API Route Tests", () => {
  // test("")
  test("GET /handleAllRoutes returns 200", async () => {
    console.log("hi")
    console.log("testId inside test:", testId);
    const res = await request(app).get("/handleAllRoutes");
    expect(res.statusCode).toBe(200);

    const taxCount = await Tax.countDocuments();
    expect(taxCount).toBeGreaterThan(0);
  });

  test("GET /scenario/:id returns 200 or 404", async () => {
    const res = await request(app).get(`/scenario/660f5dd80f43c3148c52c780`);
    expect([200, 404]).toContain(res.statusCode);
  });

//   test("GET /scenario/:id/investments returns 200 or 404", async () => {
//     const res = await request(app).get(`/scenario/${testId}/investments`);
//     expect([200, 404]).toContain(res.statusCode);
//   });

//   test("GET /getRebalanceStrategy/:id returns 200 or 404", async () => {
//     const res = await request(app).get(`/getRebalanceStrategy/${testId}`);
//     expect([200, 404]).toContain(res.statusCode);
//   });

//   test("GET /runSimulation returns 200 or 400", async () => {
//     const res = await request(app).get("/runSimulation");
//     expect([200, 400]).toContain(res.statusCode);
//   });

//   test('POST /importScenario imports scenario', async () => {
//   const res = await request(app).post('/importScenario').send({
//     // mock scenario data
//     name: 'Test Scenario',
//     userId: testId,
//     investments: [],
//     investmentTypes: [],
//     income: [],
//     expense: [],
//     invest: [],
//     rebalance: [],
//     scenario: { _id: new mongoose.Types.ObjectId(), name: 'Test Scenario' },
//   });

//   expect([200, 201]).toContain(res.statusCode);
//   expect(res.body).toHaveProperty('message', 'Scenario successfully imported');
// });


  // test("POST /updateInvestStrategy/:id updates invest strategy", async () => {
  //   const res = await request(app).post(`/updateInvestStrategy/${testId}`).send({ strategyName: "Aggressive" });
  //   expect([200, 404]).toContain(res.statusCode);
  // });

  // test("GET /unknownRoute returns 404", async () => {
  //   const res = await request(app).get("/doesnotexist");
  //   expect(res.statusCode).toBe(404);
  // });

  describe('POST /importScenario', () => {
    let testId;
  
    beforeAll(() => {
      testId = new mongoose.Types.ObjectId();
    });
  
    afterEach(async () => {
      // Clean up inserted scenarios
      await Scenario.deleteMany({ userId: testId });
    });
  
    it('should import a scenario successfully with valid data', async () => {
      const mockScenario = {
        name: 'Test Scenario',
        userId: testId,
        investments: [],
        investmentTypes: [],
        income: [],
        expense: [],
        invest: [],
        rebalance: [],
        scenario: { _id: new mongoose.Types.ObjectId(), name: 'Test Scenario' },
      };
  
      const res = await request(app).post('/importScenario').send(mockScenario);
  
      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('message', 'Scenario successfully imported');
  
      // Verify it was saved in the DB
      const saved = await Scenario.findOne({ userId: testId, name: 'Test Scenario' });
      expect(saved).not.toBeNull();
    });
  });
});
