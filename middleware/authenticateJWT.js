import jwt from "jsonwebtoken";

export function authenticateJWT(req, res, next) {
  const authHeader = req.header.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Forbidden: Invalid or expired token" });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
}
