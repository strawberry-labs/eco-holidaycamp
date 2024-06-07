import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many requests, please try again later.",
  headers: true,
});

export const applyRateLimiter = (req, res, next) => {
  return new Promise((resolve, reject) => {
    rateLimiter(req, res, (result) =>
      result instanceof Error ? reject(result) : resolve(result)
    );
  }).then(next);
};
