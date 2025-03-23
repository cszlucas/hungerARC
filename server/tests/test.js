const axios = require("axios");
const { Income, Expense } = require("./route-test.js");
const { investStrategy } = require("../controllers/events.js");

// Mock axios
jest.mock("axios");

describe("Income function", () => {
  it("should make two POST requests, a create, and an update, with the correct data", async () => {
    axios.post.mockResolvedValue({ data: "Mocked Response" }); // Mock response

    const dynamicId = '67df3c2523356bddab87a00e'; // Example dynamic ID

    await Income(dynamicId); // Call the Income function

    // Test if axios.post was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/incomeEvent",
      expect.objectContaining({
        eventSeriesName: "income1980-2000",
        initialAmount: 50000,
      })
    );

    const updateCall = axios.post.mock.calls.find(
      (call) => call[0].includes("updateIncome") // Check if the URL contains 'updateIncome'
    );

    expect(updateCall).toBeDefined(); // Ensure the call was made

    // Assert the data being sent in the second request
    expect(updateCall[1]).toEqual(
      expect.objectContaining({
        eventSeriesName: "updated Income",
        initialAmount: 500,
      })
    );
  });

  it("should handle errors", async () => {
    axios.post.mockRejectedValue(new Error("Network Error")); // Mock error

    console.error = jest.fn(); // Mock console.error

    await Income(); // Call the Income function

    expect(console.error).toHaveBeenCalledWith("Error fetching income:", expect.any(Error));
  });
});

describe("Expense function", () => {
  it("should make two POST requests, a create, and an update, with the correct data", async () => {
    axios.post.mockResolvedValue({ data: "Mocked Response" }); // Mock response

    const dynamicId = '67df3c2523356bddab87a00e'; // Example dynamic ID

    await Expense(dynamicId); // Call the Income function

    // Test if axios.post was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/expenseEvent",
      expect.objectContaining({
        eventSeriesName: "Expense 1980-1990",
        initialAmount: 1200,
      })
    );

    const updateCall = axios.post.mock.calls.find(
      (call) => call[0].includes("updateExpense") 
    );

    expect(updateCall).toBeDefined(); // Ensure the call was made

    // Assert the data being sent in the second request
    expect(updateCall[1]).toEqual(
      expect.objectContaining({
        eventSeriesName: "updated Expense",
        initialAmount: 500,
      })
    );
  });

  it("should handle errors", async () => {
    axios.post.mockRejectedValue(new Error("Network Error")); // Mock error

    console.error = jest.fn(); // Mock console.error

    await Income(); // Call the Income function

    expect(console.error).toHaveBeenCalledWith("Error fetching income:", expect.any(Error));
  });
});


describe("InvestEvent function", () => {
  it("should make two POST requests, a create, and an update, with the correct data", async () => {
    axios.post.mockResolvedValue({ data: "Mocked Response" }); // Mock response

    const dynamicId = '67df3c2523356bddab87a00e'; // Example dynamic ID

    await investStrategy(dynamicId); // Call the Income function

    // Test if axios.post was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/investStrategy",
      expect.objectContaining({
        eventSeriesName: "Invest 2020-2023",
        maxCash: 100,
      })
    );

    const updateCall = axios.post.mock.calls.find(
      (call) => call[0].includes("updateExpense") 
    );

    expect(updateCall).toBeDefined(); // Ensure the call was made

    // Assert the data being sent in the second request
    expect(updateCall[1]).toEqual(
      expect.objectContaining({
        eventSeriesName: "updated invest strategy",
        maxCash: 500,
      })
    );
  });

  it("should handle errors", async () => {
    axios.post.mockRejectedValue(new Error("Network Error")); // Mock error

    console.error = jest.fn(); // Mock console.error

    await Income(); // Call the Income function

    expect(console.error).toHaveBeenCalledWith("Error fetching income:", expect.any(Error));
  });
});