const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (token) => {
  try {
    const decode = jwt.verify(token, JWT_SECRET);
    return decode;
  } catch (error) {
    throw new Error("Invalid Token");
  }
};
 
const extractUserId = (decodedToken) => {
  if (decodedToken && decodedToken.userId) {
    return decodedToken.userId;
  } else {
    throw new Error("Invalid or missing userId in the token");
  }
};

const verifyAuth = (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    const decodedToken = verifyToken(token);
    const userId = extractUserId(decodedToken);
    req.user = { userId };
    return next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Unauthorised access,please add the token" });
  }
};

module.exports = { verifyAuth };
