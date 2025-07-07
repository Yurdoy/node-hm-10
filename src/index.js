import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";

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

const users = [
  {
    id: "1",
    email: "user@example.com",
    password: await bcrypt.hash("password123", 10),
  },
];

const jwtSecret = process.env.JWT_SECRET || "your_secret_key";

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = user.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
