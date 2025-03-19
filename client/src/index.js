import React from 'react';
import ReactDOM from 'react-dom/client';

import Homepage from './pages/homepage';
import Login from './pages/login';
import ScenarioList from './pages/scenario/scenarioList';
import Profile from './pages/profile';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// import { useContext, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// import { AuthContext } from "./components/AuthContext";
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/appContext';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Homepage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/scenarios",
    element: <ScenarioList />,
  },
  {
    path: "/profile",
    element: <Profile/>,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
