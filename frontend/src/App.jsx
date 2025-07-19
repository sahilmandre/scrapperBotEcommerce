import { Outlet } from "react-router-dom";

 function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Optional: Add Navbar Here */}
      <Outlet />
    </div>
  );
}

export default App;