const axios = require("axios");
const { Income, Expense, InvestStrategy, RebalanceStrategy, Investments } = require("./route-test.js");

// Mock axios
jest.mock("axios");

describe("Income function", () => {
  it("should make two POST requests, a create, and an update, with the correct data", async () => {
    axios.post.mockResolvedValue({ data: "Mocked Response" }); // Mock response

    const dynamicId = "67df3c2523356bddab87a00e"; // Example dynamic ID

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

    const dynamicId = "67df3c2523356bddab87a00e"; // Example dynamic ID

    await Expense(dynamicId); // Call the Income function

    // Test if axios.post was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/expenseEvent",
      expect.objectContaining({
        eventSeriesName: "Expense 1980-1990",
        initialAmount: 1200,
      })
    );

    const updateCall = axios.post.mock.calls.find((call) => call[0].includes("updateExpense"));

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

    await Expense();

    expect(console.error).toHaveBeenCalledWith("Error fetching expense:", expect.any(Error));
  });
});

describe("InvestEvent function", () => {
  it("should make two POST requests, a create, and an update, with the correct data", async () => {
    axios.post.mockResolvedValue({ data: "Mocked Response" }); // Mock response

    const dynamicId = "67df3c2523356bddab87a00e"; // Example dynamic ID

    await InvestStrategy(dynamicId); // Call the Income function

    // Test if axios.post was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/investStrategy",
      expect.objectContaining({
        eventSeriesName: "Invest 2020-2023",
        maxCash: 100,
      })
    );

    const updateCall = axios.post.mock.calls.find((call) => call[0].includes("updateInvestStrategy"));

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

    await InvestStrategy();

    expect(console.error).toHaveBeenCalledWith("Error invest strategy:", expect.any(Error));
  });
});

describe("RebalanceEvent function", () => {
  it("should make two POST requests, a create, and an update, with the correct data", async () => {
    axios.post.mockResolvedValue({ data: "Mocked Response" }); // Mock response

    const dynamicId = "67df3c2523356bddab87a00e"; // Example dynamic ID

    await RebalanceStrategy(dynamicId);

    // Test if axios.post was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/rebalanceStrategy",
      expect.objectContaining({
        eventSeriesName: "Rebalance 2023",
        startYear: {
          type: "year",
          year: 2023,
        },
      })
    );

    const updateCall = axios.post.mock.calls.find((call) => call[0].includes("updateRebalanceStrategy"));

    expect(updateCall).toBeDefined(); // Ensure the call was made

    // Assert the data being sent in the second request
    expect(updateCall[1]).toEqual(
      expect.objectContaining({
        eventSeriesName: "Rebalance Updated",
        startYear: {
          type: "year",
          year: 2025,
        },
      })
    );
  });

  it("should handle errors", async () => {
    axios.post.mockRejectedValue(new Error("Network Error")); // Mock error

    console.error = jest.fn(); // Mock console.error

    await RebalanceStrategy();

    expect(console.error).toHaveBeenCalledWith("Error updating RebalanceStrategy:", expect.any(Error));
  });
});

describe("Investments function", () => {
  it("should make two POST requests, a create, and an update, with the correct data", async () => {
    axios.post.mockResolvedValue({ data: "Mocked Response" }); // Mock response

    const dynamicId = "67df3c2523356bddab87a00e"; // Example dynamic ID

    await Investments(dynamicId);

    // Test if axios.post was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/investmentType",
      expect.objectContaining({
        name: "Bond Fund",
        taxability: "pre-tax",
      })
    );

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/investment",
      expect.objectContaining({
        value: 100,
        accountTaxStatus: "pre-tax",
      })
    );
    const updateCall2 = axios.post.mock.calls.find((call) => call[0].includes("updateInvestment"));

    // Ensure the second call was made
    expect(updateCall2).toBeDefined();

    // Assert the data being sent in the second request (e.g., updating investment)
    expect(updateCall2[1]).toEqual(
      expect.objectContaining({
        value: 10,
        accountTaxStatus: "non-tax",
      })
    );
  });

  it("should handle errors", async () => {
    axios.post.mockRejectedValue(new Error("Network Error")); // Mock error

    console.error = jest.fn(); // Mock console.error

    await Investments();

    expect(console.error).toHaveBeenCalledWith("Error updating Investments", expect.any(Error));
  });
});
