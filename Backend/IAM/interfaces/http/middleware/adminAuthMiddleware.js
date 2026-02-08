module.exports = (jwtService) => {
    return (req, res, next) => {
      try {
        const token = req.cookies?.accessToken;
        if (!token) return res.status(401).json({ message: "No token provided" });
  
        const decoded = jwtService.verify(token);
  
        if (decoded.role !== "admin") {
          return res.status(403).json({ message: "Forbidden" });
        }
  
        req.user = {
          uid: decoded.admin_id,
          username: decoded.username,
          role: "admin",
        };
  
        req.admin = { admin_id: decoded.admin_id, username: decoded.username };
  
        next();
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token expired" });
        }
        return res.status(401).json({ message: "Unauthorized" });
      }
    };
  };
  