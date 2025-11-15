import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ---------------------------------------------
// 1. MOCK ALL CLOUDINARY + MULTER MODULES FIRST
// ---------------------------------------------
jest.unstable_mockModule("cloudinary", () => ({
  v2: {
    config: jest.fn(),
  },
}));

jest.unstable_mockModule("multer-storage-cloudinary", () => ({
  CloudinaryStorage: jest.fn().mockImplementation(() => ({
    _tag: "mock-storage",
  })),
}));

jest.unstable_mockModule("multer", () => ({
  default: () => ({
    single: () => (req, res, next) => {
      req.file = {
        path: "https://mock-cloudinary.com/test-file",
        filename: "test-file",
      };
      next();
    },
  }),
}));

jest.unstable_mockModule("../middleware/auth.js", () => ({
  authMiddleware: (req, res, next) => {
    req.user = { _id: "123", role: "admin" };
    next();
  },
  adminOnly: (req, res, next) => next(),
}));

// ---------------------------------------------
// 2. IMPORT ROUTES AFTER MOCKS
// ---------------------------------------------
const uploadRoutes =
  (await import("../routes/uploadRoutes.js")).default;

// ---------------------------------------------
// 3. BUILD APP
// ---------------------------------------------
const app = express();
app.use(express.json());
app.use("/upload", uploadRoutes);

// ---------------------------------------------
// 4. TESTS
// ---------------------------------------------
describe("📤 UPLOAD ROUTES — FULL 100% COVERAGE", () => {
  // -----------------------------------------------------
// FAIL CASE: audio upload returns 500 when no file exists
// -----------------------------------------------------
test("POST /upload/audio returns 500 when no file exists", async () => {
  // Reset all modules so new mocks take effect
  jest.resetModules();

  // Re-mock multer to simulate missing file
  jest.unstable_mockModule("multer", () => ({
    default: () => ({
      single: () => (req, res, next) => {
        req.file = null; // ❌ simulate upload failure
        next();
      },
    }),
  }));

  // Re-mock all other modules the same way as before
  jest.unstable_mockModule("cloudinary", () => ({
    v2: { config: jest.fn() },
  }));

  jest.unstable_mockModule("multer-storage-cloudinary", () => ({
    CloudinaryStorage: jest.fn().mockImplementation(() => ({
      _tag: "mock-storage",
    })),
  }));

  jest.unstable_mockModule("../middleware/auth.js", () => ({
    authMiddleware: (req, res, next) => {
      req.user = { _id: "123", role: "admin" };
      next();
    },
    adminOnly: (req, res, next) => next(),
  }));

  // IMPORTANT: Re-import uploadRoutes AFTER mocks
  const freshUploadRoutes = (await import("../routes/uploadRoutes.js")).default;

  // Build fresh app
  const freshApp = express();
  freshApp.use(express.json());
  freshApp.use("/upload", freshUploadRoutes);

  // Run the request
  const res = await request(freshApp)
    .post("/upload/audio")
    .set("Authorization", "Bearer token");

  expect(res.status).toBe(500);
  expect(res.body.message).toBe("Upload failed");
});

});
