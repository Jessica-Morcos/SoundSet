// src/__mocks__/multer-storage-cloudinary.js

// Import 'jest' explicitly because it's not a global in ESM tests.
import { jest } from '@jest/globals';

// Define CloudinaryStorage as a Jest mock function.
// It returns an empty object to satisfy the import signature.
export const CloudinaryStorage = jest.fn().mockImplementation(() => {
  return {};
});
