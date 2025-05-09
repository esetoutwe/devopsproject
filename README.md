# Full-Stack Web Application on Kubernetes

This is a full-stack web application using **PostgreSQL**, **Node.js (Express)**, and **React**. It includes user registration, login, and token-based authentication.

![image](https://github.com/user-attachments/assets/667f410f-2580-4175-bc06-1f1f66cff22f)

## 🛠️ Features

- User registration (signup) and login (signin)
- Password hashing with `bcryptjs`
- JWT-based authentication
- PostgreSQL database integration
- React frontend with form validation

## 📂 Project Structure
```
react-signupPage-postgres/
├── backend/         # Node.js API
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   ├── .env
├── frontend/        # React App
│   ├── Dockerfile
│   ├── src/
│   ├── package.json
├── db/              # PostgreSQL
│   ├── init.sql
├── k8s/             # Kubernetes manifests
│   ├── postgres-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── pgadmin-deployment.yaml (optional)
│   ├── ingress.yaml
│   ├── secrets.yaml
│   ├── configmap.yaml
├── docker-compose.yaml (for local testing)

```

## Getting Started

### Prerequisites
Ensure you have the following installed:
- Node.js
- PostgreSQL
- Kubernetes cluster
- Github account
- DockerHub account

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

### 4. Test the Application Locally

1. Open `http://localhost:3000/signup` in your browser.
2. Create an account.
3. Log in at `http://localhost:3000/signin`.



### 5. Create Container and Run Application On Kubernetes

1. Set Up PostgreSQL Database

 Create db/init.sql (to create a users table)
```
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. Create Docker Containers Files

 Backend (backend/Dockerfile)
```
# Use official Node.js image
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5001
CMD ["node", "server.js"]
```

 Frontend (frontend/Dockerfile)
```
# Use official Node.js image for React build
FROM node:20 as build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve static files with Nginx
FROM nginx:latest
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

3. Build Docker Images

Build image for Backendend - Image name "backend1.0"
```
cd backend
docker build -t local/backend10 .
docker tag local/backend10 <github account>/backend:1.0
docker push <github account>/backend:1.0
```

Build image for Frontend - Image name "frontend1.0"
```
cd frontend
docker build -t local/frontend10 .
docker tag local/frontend10 <github account>/frontend:1.0
docker push <github account>/frontend:1.0
```

4. Kubernetes YAML files to deploy Docker images on Kubernetes Cluster

 PostgreSQL (k8s/postgres-deployment.yaml)
 ```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:latest
        env:
        - name: POSTGRES_DB
          value: "mydb"
        - name: POSTGRES_USER
          value: "myuser"
        - name: POSTGRES_PASSWORD
          value: "mypassword"
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  ports:
  - port: 5432
  selector:
    app: postgres
```

 Backend Deployment (k8s/backend-deployment.yaml)
 ```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: backend-image
        env:
        - name: DB_HOST
          value: "postgres"
        - name: DB_USER
          value: "myuser"
        - name: DB_PASSWORD
          value: "mypassword"
        - name: JWT_SECRET
          value: "mysecret"
        ports:
        - containerPort: 5001

---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 5001
    targetPort: 5001
```

 Frontend Deployment (k8s/frontend-deployment.yaml)
 ```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: frontend-image
        ports:
        - containerPort: 3000

---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Ingress for Routing - (k8s/ingress.yaml)
```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: myapp.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 5001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

5. Apply Kubernetes Configurations
```
kubectl apply -f k8s/
```

6. Access the Application

Frontend: http://myapp.local
Backend API: http://myapp.local/api
PostgreSQL: Accessible inside the cluster

