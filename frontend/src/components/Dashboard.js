import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
} from "react-icons/fi";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const res = await fetch("http://localhost:5001/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 403) throw new Error("Unauthorized");

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Dashboard error:", error);
        navigate("/signin");
      }
    };

    fetchUser();
  }, [navigate]);

  // Sample user data for demonstration
  const users = [
    { id: 1, firstName: "John", lastName: "Doe", email: "john@example.com" },
    { id: 2, firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
    { id: 3, firstName: "Alice", lastName: "Johnson", email: "alice@example.com" },
  ];

  // Function to render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>;
      case "users":
        return (
          <div>
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">First Name</th>
                  <th className="p-2 border">Last Name</th>
                  <th className="p-2 border">Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100">
                    <td className="p-2 border">{user.firstName}</td>
                    <td className="p-2 border">{user.lastName}</td>
                    <td className="p-2 border">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "settings":
        return <h1 className="text-2xl font-bold">Edit Settings</h1>;
      default:
        return <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-20 md:w-64 bg-gray-100 text-black transition-width duration-300 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-2xl font-semibold hidden md:block">Admin Portal</h2>
          <button>
            <FiMenu size={24} />
          </button>
        </div>

        <nav className="mt-4 flex-1">
          <ul className="space-y-4">
            <li
              onClick={() => setActiveTab("home")}
              className={`flex items-center p-4 hover:bg-blue-500 cursor-pointer ${
                activeTab === "home" ? "bg-gray-600" : ""
              }`}
            >
              <FiHome size={24} />
              <span className="ml-4 md:block">Home</span>
            </li>

            <li
              onClick={() => setActiveTab("users")}
              className={`flex items-center p-4 hover:bg-gray-700 cursor-pointer ${
                activeTab === "users" ? "bg-gray-600" : ""
              }`}
            >
              <FiUsers size={24} />
              <span className="ml-4 md:block">Users</span>
            </li>

            <li
              onClick={() => setActiveTab("settings")}
              className={`flex items-center p-4 hover:bg-gray-700 cursor-pointer ${
                activeTab === "settings" ? "bg-gray-600" : ""
              }`}
            >
              <FiSettings size={24} />
              <span className="ml-4 md:block">Settings</span>
            </li>

            <li
              onClick={() => navigate("/signin")}
              className="flex items-center p-4 hover:bg-gray-700 cursor-pointer"
            >
              <FiLogOut size={24} />
              <span className="ml-4 md:block">Logout</span>
            </li>
          </ul>
        </nav>
      </div>

      {/* Dashboard Content */}
      <div className="flex-grow min-h-screen bg-white p-6">{renderContent()}</div>
    </div>
  );
};

export default Dashboard;
