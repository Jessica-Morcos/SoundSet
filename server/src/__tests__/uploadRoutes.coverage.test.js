import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// 🔒 Mock Cloudinary
jest.unstable_mockModule("cloudinary", () => ({
  v2: {
    config: jest.fn(),
  },
}));

// 🔒 Mock Cloudinary Storage
jest.unstable_mockModule("multer-storage-cloudinary", () => ({
  CloudinaryStorage: jest.fn().mockImplementation(() => ({
    _tag: "mock-storage",
  })),
}));

// 🔒 Mock Auth
jest.unstable_mockModule("../middleware/auth.js", () => ({
  authMiddleware: (req, res, next) => {
    req.user = { _id: "123", role: "admin" };
    next();
  },
  adminOnly: (req, res, next) => next(),
}));

// --------------------------------------------------
// Default multer mock → SUCCESS CASE
// --------------------------------------------------
jest.unstable_mockModule("multer", () => ({
  default: () => ({
    single: () => (req, res, next) => {
      req.file = {
        path: "https://cdn.test/success",
        filename: "success-file",
      };
      next();
    },
  }),
}));

// Import routes AFTER mocks
const uploadRoutes =
  (await import("../routes/uploadRoutes.js")).default;

// Build test app
const app = express();
app.use(express.json());
app.use("/upload", uploadRoutes);

describe("uploadRoutes.js — 100% COVERAGE", () => {
  // ------------------------------------------------------
  // 1️⃣ SUCCESS — /audio
  // ------------------------------------------------------
  test("POST /upload/audio → success", async () => {
    const res = await request(app)
      .post("/upload/audio")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body.url).toBe("https://cdn.test/success");
  });

  // ------------------------------------------------------
  // 2️⃣ SUCCESS — /cover
  // ------------------------------------------------------
  test("POST /upload/cover → success", async () => {
    const res = await request(app)
      .post("/upload/cover")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body.url).toBe("https://cdn.test/success");
  });

  // ------------------------------------------------------
  // 3️⃣ FAILURE — /audio (no file)
  // ------------------------------------------------------
  test("POST /upload/audio → failure (no file)", async () => {
    jest.resetModules();

    // Re-mock multer → return NO FILE
    jest.unstable_mockModule("multer", () => ({
      default: () => ({
        single: () => (req, res, next) => {
          req.file = null;
          next();
        },
      }),
    }));

    // Re-import route with new mock
    const routes =
      (await import("../routes/uploadRoutes.js")).default;

    const app2 = express();
    app2.use(express.json());
    app2.use("/upload", routes);

    const res = await request(app2)
      .post("/upload/audio")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Upload failed");
  });

  // ------------------------------------------------------
  // 4️⃣ FAILURE — /cover (no file)
  // ------------------------------------------------------
  test("POST /upload/cover → failure (no file)", async () => {
    jest.resetModules();

    jest.unstable_mockModule("multer", () => ({
      default: () => ({
        single: () => (req, res, next) => {
          req.file = null;
          next();
        },
      }),
    }));

    const routes =
      (await import("../routes/uploadRoutes.js")).default;

    const app3 = express();
    app3.use(express.json());
    app3.use("/upload", routes);

    const res = await request(app3)
      .post("/upload/cover")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Upload failed");
  });
});
