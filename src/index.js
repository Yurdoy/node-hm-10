import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";
import { authenticateJWT } from "./middleware/authenticateJWT.js";
import { authorizeRole } from "./middleware/authorizeRole.js";

const app = express();
app.use(express.json());

function logRequest(req, res, next) {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
}

app.use(logRequest);

app.get("/", (req, res) => {
  res.send("This is Home Page");
});

const users = [];

async function initializeUsers() {
  const hashedPassword = await bcrypt.hash("password123", 10);
  users.push({
    id: "1",
    username: "user1",
    email: "user@example.com",
    password: hashedPassword,
    role: "admin",
  });
  users.push({
    id: "2",
    username: "user2",
    email: "user2@example.com",
    password: hashedPassword,
    role: "user",
  });
}

initializeUsers();

const jwtSecret = process.env.JWT_SECRET || "your_secret_key";

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "User  not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/update-role", authenticateJWT, authorizeRole("admin"), (req, res) => {
  const { userId, newRole } = req.body;

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: "User  not found" });
  }
  user.role = newRole;

  res.json({ message: "User role updated successfully", user });
});

app.put("/update-email", authenticateJWT, (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = users.find((u) => u.id === req.user.userId);

  if (!user) {
    return res.status(404).json({ message: "User  not found" });
  }

  user.email = email;

  res.json({
    message: "Email updated successfully",
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

app.delete("/delete-account", authenticateJWT, (req, res) => {
  const userId = req.user.userId;
  const userExists = users.some((user) => user.id === userId);
  if (!userExists) {
    return res.status(404).json({ message: "User  not found" });
  }
  const updatedUsers = users.filter((user) => user.id !== userId);
  users.length = 0;
  users.push(...updatedUsers);
  res.json({ message: "Account successfully deleted" });
});

app.post("/refresh-token", authenticateJWT, (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const { userId, email } = req.user;

  if (!token) {
    return res.status(401).json({ message: "Token is required" });
  }
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token is invalid or expired" });
    }
  });
  const newToken = jwt.sign({ userId, email }, jwtSecret, { expiresIn: "1h" });
  res.json({ message: "This is your new token", token: newToken });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
