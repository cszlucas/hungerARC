import React from 'react';
import ReactDOM from 'react-dom/client';

import Homepage from './pages/homepage';
import Login from './pages/login';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// import { useContext, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// import { AuthContext } from "./components/AuthContext";
import { AuthProvider } from './context/AuthContext';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Homepage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
