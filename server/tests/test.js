const axios = require("axios");
const { Income, Expense, InvestStrategy, RebalanceStrategy, Investments, Scenario } = require("./route-test.js");

// Mock axios
jest.mock("axios");
const scenarioId = "833f3c2523356bddab87a833";

describe("Income function", () => {
  it("should make two POST requests, a create, and an update, with the correct data", async () => {
    axios.post.mockResolvedValue({ data: "Mocked Response" }); // Mock response

    const dynamicId = "67df3c2523356bddab87a00e"; // Example dynamic ID

    await Income(dynamicId); // Call the Income function

    // Test if axios.post was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      `http://localhost:8080/scenario/${scenarioId}/incomeEvent`,
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

    // const mockData = { eventSeriesName: "income1980-2000", initialAmount: 50000 };
    // axios.get.mockResolvedValue({ data: mockData });
    // expect(result).toEqual(mockData);
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
      `http://localhost:8080/scenario/${scenarioId}/expenseEvent`,
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
      `http://localhost:8080/scenario/${scenarioId}/investStrategy`,
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
      `http://localhost:8080/scenario/${scenarioId}/rebalanceStrategy`,
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
      `http://localhost:8080/scenario/${scenarioId}/investmentType`,
      expect.objectContaining({
        name: "Bond Fund",
        taxability: "pre-tax",
      })
    );

    expect(axios.post).toHaveBeenCalledWith(
      `http://localhost:8080/scenario/${scenarioId}/investment`,
      expect.objectContaining({
        value: 100,
        accountTaxStatus: "pre-tax",
      })
    );
    const updateCall = axios.post.mock.calls.find((call) => call[0].includes("updateInvestment"));

    // Ensure the second call was made
    expect(updateCall).toBeDefined();

    // Assert the data being sent in the second request (e.g., updating investment)
    // expect(updateCall2[1]).toEqual(
    //   expect.objectContaining({
    //     value: 10,
    //     accountTaxStatus: "non-tax",
    //   })
    // );
  });

  it("should handle errors", async () => {
    axios.post.mockRejectedValue(new Error("Network Error")); // Mock error

    console.error = jest.fn(); // Mock console.error

    await Investments();

    expect(console.error).toHaveBeenCalledWith("Error updating Investments", expect.any(Error));
  });
});

describe("Scenario function", () => {
  it("should update the scenario with modified data", async () => {
    // Mock the response for axios.get
    axios.get.mockResolvedValue({
      data: {
        id: "67df22db4996aba7bb6e8d73",
        name: "Original scenario",
      },
    });

    // Mock the response for axios.post
    axios.post.mockResolvedValue({
      data: {
        id: "67df22db4996aba7bb6e8d73",
        name: "My fourth scenario", // This is the modified name
      },
    });

    // Call the Scenario function
    await Scenario();

    // Check that axios.get was called with the correct URL
    expect(axios.get).toHaveBeenCalledWith("http://localhost:8080/scenario/67df22db4996aba7bb6e8d73");

    // Check that axios.post was called with the correct URL and modified data
    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8080/updateScenario/67df22db4996aba7bb6e8d73",
      expect.objectContaining({
        id: "67df22db4996aba7bb6e8d73",
        name: "My fourth scenario",
      })
    );
  });

  it("should handle errors gracefully", async () => {
    // Mock the axios.get to throw an error
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch scenario"));

    console.error = jest.fn(); // Mock console.error

    // Call the Scenario function and expect it to catch the error
    await Scenario();

    // Check if console.error was called
    expect(console.error).toHaveBeenCalledWith("Error updating:", expect.any(Error));
  });
});
