import React from "react";
import { Outlet } from "react-router-dom";

const Scenarios = () => {
  return (
    <div>
      <Outlet /> {/* ✅ This will render the correct child page */}
    </div>
  );
};

export default Scenarios;