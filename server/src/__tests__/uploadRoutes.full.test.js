import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

/* -------------------------------------------
   1️⃣ UNIVERSAL MOCKS (shared by ALL tests)
--------------------------------------------*/

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

// DEFAULT SUCCESS MULTER MOCK
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

// AUTH ALWAYS RETURNS ADMIN
jest.unstable_mockModule("../middleware/auth.js", () => ({
  authMiddleware: (req, res, next) => {
    req.user = { _id: "123", role: "admin" };
    next();
  },
  adminOnly: (req, res, next) => next(),
}));

// MUST IMPORT AFTER MOCKS
const uploadRoutes =
  (await import("../routes/uploadRoutes.js")).default;

/* -------------------------------------------
   2️⃣ MAIN APP INSTANCE
--------------------------------------------*/
const app = express();
app.use(express.json());
app.use("/upload", uploadRoutes);

/* -------------------------------------------
   3️⃣ SUCCESS TESTS
--------------------------------------------*/

describe("UPLOAD ROUTES — SUCCESS + FAILURE FULL BRANCH COVERAGE", () => {
  test("POST /upload/audio → success", async () => {
    const res = await request(app)
      .post("/upload/audio")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body.url).toBe("https://cdn.test/success");
  });

  test("POST /upload/cover → success", async () => {
    const res = await request(app)
      .post("/upload/cover")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body.url).toBe("https://cdn.test/success");
  });

  /* -------------------------------------------
     4️⃣ FAILURE CASES — MISSING FILE (audio)
  --------------------------------------------*/
  test("POST /upload/audio → failure when NO FILE returned", async () => {
    jest.resetModules();

    // *** RE-MOCK MULTER TO RETURN NO FILE ***
    jest.unstable_mockModule("multer", () => ({
      default: () => ({
        single: () => (req, res, next) => {
          req.file = null;
          next();
        },
      }),
    }));

    // RE-MOCK SUPPORTING MODULES (must repeat)
    jest.unstable_mockModule("cloudinary", () => ({
      v2: { config: jest.fn() },
    }));

    jest.unstable_mockModule("multer-storage-cloudinary", () => ({
      CloudinaryStorage: jest.fn().mockImplementation(() => ({})),
    }));

    jest.unstable_mockModule("../middleware/auth.js", () => ({
      authMiddleware: (req, res, next) => {
        req.user = { _id: "123", role: "admin" };
        next();
      },
      adminOnly: (req, res, next) => next(),
    }));

    // MUST RE-IMPORT AFTER RESET
    const freshRoutes =
      (await import("../routes/uploadRoutes.js")).default;

    const freshApp = express();
    freshApp.use(express.json());
    freshApp.use("/upload", freshRoutes);

    const res = await request(freshApp)
      .post("/upload/audio")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Upload failed");
  });

  /* -------------------------------------------
     5️⃣ FAILURE CASE — MISSING FILE (cover)
  --------------------------------------------*/
  test("POST /upload/cover → failure when NO FILE returned", async () => {
    jest.resetModules();

    jest.unstable_mockModule("multer", () => ({
      default: () => ({
        single: () => (req, res, next) => {
          req.file = null;
          next();
        },
      }),
    }));

    jest.unstable_mockModule("cloudinary", () => ({
      v2: { config: jest.fn() },
    }));

    jest.unstable_mockModule("multer-storage-cloudinary", () => ({
      CloudinaryStorage: jest.fn().mockImplementation(() => ({})),
    }));

    jest.unstable_mockModule("../middleware/auth.js", () => ({
      authMiddleware: (req, res, next) => {
        req.user = { _id: "123", role: "admin" };
        next();
      },
      adminOnly: (req, res, next) => next(),
    }));

    const freshRoutes =
      (await import("../routes/uploadRoutes.js")).default;

    const freshApp = express();
    freshApp.use(express.json());
    freshApp.use("/upload", freshRoutes);

    const res = await request(freshApp)
      .post("/upload/cover")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Upload failed");
  });

  /* -------------------------------------------
     6️⃣ EXTRA FAILURE TEST (FROM 2nd FILE)
  --------------------------------------------*/
  test("POST /upload/audio returns 500 when no file exists (additional branch)", async () => {
    jest.resetModules();

    jest.unstable_mockModule("multer", () => ({
      default: () => ({
        single: () => (req, res, next) => {
          req.file = null;
          next();
        },
      }),
    }));

    // repeat required mocks
    jest.unstable_mockModule("cloudinary", () => ({
      v2: { config: jest.fn() },
    }));

    jest.unstable_mockModule("multer-storage-cloudinary", () => ({
      CloudinaryStorage: jest.fn().mockImplementation(() => ({ _tag: "mock" })),
    }));

    jest.unstable_mockModule("../middleware/auth.js", () => ({
      authMiddleware: (req, res, next) => {
        req.user = { _id: "123", role: "admin" };
        next();
      },
      adminOnly: (req, res, next) => next(),
    }));

    const freshRoutes =
      (await import("../routes/uploadRoutes.js")).default;

    const freshApp = express();
    freshApp.use(express.json());
    freshApp.use("/upload", freshRoutes);

    const res = await request(freshApp)
      .post("/upload/audio")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Upload failed");
  });
});
