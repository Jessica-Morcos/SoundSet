// This REPLACES your real auth middleware during tests

export function mockUser(userId, role = "user") {
  return (req, res, next) => {
    req.user = { _id: userId, role };
    next();
  };
}

// (optional: keep the old name if you want)
export function mockAuth(role = "user") {
  return (req, res, next) => {
    req.user = { _id: req.headers["x-user-id"], role };
    next();
  };
}
