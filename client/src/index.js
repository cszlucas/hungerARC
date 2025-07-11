import React from "react";
import ReactDOM from "react-dom/client";

import Profile from "./pages/profile";
import Scenarios from "./scenarios";
import Login from "./pages/login";
import ScenarioList from "./pages/scenario/scenarioList";
import Basics from "./pages/scenario/basics";
import InvestmentLists from "./pages/scenario/invesments/investmentLists";
import EventSeriesList from "./pages/scenario/events/eventSeriesList";
import EventSeries from "./pages/scenario/events/eventSeries";
import InvestmentType from "./pages/scenario/invesments/investmentType";
import Income from "./pages/scenario/events/income";
import Expense from "./pages/scenario/events/expense";
import Invest from "./pages/scenario/events/invest";
import Rebalance from "./pages/scenario/events/rebalance";
import RunSimulations from "./pages/scenario/runSimulations";
import Strategies from "./pages/scenario/strategies";
import Charts from "./pages/Charts/charts";
import OneDimensionalCharts from "./pages/Charts/odeCharts";
import TwoDimensionalCharts from "./pages/Charts/tdeCharts";
import Test from "./test";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AuthProvider } from "./context/authContext";
import { AppProvider } from "./context/appContext";
import { AlertProvider } from "./context/alertContext";


const router = createBrowserRouter([
  { path: "/", element: <Login />, },
  { path: "/login", element: <Login />, },
  { path: "/profile", element: <Profile />, },
  { path: "/scenarios", element: <ScenarioList />, },
  { path: "/test", element: <Test />, },
  {
    path: "/scenario/",
    element: <Scenarios />, // ✅ Make Scenarios the parent component
    children: [
      { index: true, element: <Basics /> }, // ✅ Defaults to Basics if no subpath
      { path: "basics", element: <Basics /> },
      { path: "investment_lists", element: <InvestmentLists /> },
      { path: "event_series_list", element: <EventSeriesList /> },
      { path: "test", element: <EventSeries /> },
      { path: "investment_type", element: <InvestmentType /> },
      { path: "income", element: <Income /> },
      { path: "expense", element: <Expense /> },
      { path: "invest", element: <Invest /> },
      { path: "rebalance", element: <Rebalance /> },
      { path: "strategies", element: <Strategies/>},
      { path: "run_simulations", element: <RunSimulations /> },
    ],
  },
  {path: "/charts", element: <Charts/>},
  {path: "/ode", element: <OneDimensionalCharts/>},
  {path: "/tde", element: <TwoDimensionalCharts/>}
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <AuthProvider>
      <AppProvider>
        <AlertProvider>
          <RouterProvider router={router} />
        </AlertProvider>
      </AppProvider>
    </AuthProvider>
);

reportWebVitals();
