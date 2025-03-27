# devopsproject

# Full-Stack Authentication System

This is a full-stack authentication system using **PostgreSQL**, **Node.js (Express)**, and **React**. It includes user registration, login, and token-based authentication.

## 🛠️ Features

- User registration (signup) and login (signin)
- Password hashing with `bcryptjs`
- JWT-based authentication
- PostgreSQL database integration
- React frontend with form validation

## 📂 Project Structure
```
├── backend
│   ├── server.js
│   └── .env
└── frontend
    ├── src
    │   ├── components
    │   │    ├── Signup.js
    │   │    └── Signin.js
    │   └── App.js
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed:
- Node.js
- PostgreSQL

### 1. Set Up PostgreSQL

1. Install PostgreSQL and start the service.
2. Create a new database and `users` table:

```sql
CREATE DATABASE auth_db;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL
);
```

### 2. Backend Setup (Node.js + Express)

1. Navigate to the backend folder and install dependencies:

```bash
mkdir backend && cd backend
npm init -y
npm install express pg bcryptjs cors dotenv jsonwebtoken
```

2. Create a `.env` file in the `backend` directory:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=auth_db
DB_PASSWORD=your_password
DB_PORT=5432
SECRET_KEY=your_secret_key
```

3. Create `server.js`:

```js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const SECRET_KEY = process.env.SECRET_KEY;

// Register Route
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", [username, email, hashedPassword]);
    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
```

4. Start the backend:

```bash
node server.js
```

### 3. Frontend Setup (React)

1. Create and navigate to the frontend folder:

```bash
npx create-react-app frontend
cd frontend
npm install axios react-router-dom
```

2. Create `Signup.js` component:

```js
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/register", form);
      alert("Signup successful! Please log in.");
      navigate("/signin");
    } catch (error) {
      alert(error.response.data.error);
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;
```

3. Set up routing in `App.js`:

```js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./components/Signup";
import Signin from "./components/Signin";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
      </Routes>
    </Router>
  );
}

export default App;
```

4. Start the frontend:

```bash
npm start
```

### 4. Test the Application

1. Open `http://localhost:3000/signup` in your browser.
2. Create an account.
3. Log in at `http://localhost:3000/signin`.

✅ **Congratulations! Your full-stack authentication system is live.**

## 📜 License

This project is licensed under the [MIT License](LICENSE).

