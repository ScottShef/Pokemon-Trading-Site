/**
 * This file defines the core TypeScript interfaces related to the User model.
 * These types are used across the application, in both frontend components
 * and backend API routes, to ensure data consistency.
 */

// The IUser interface represents the full User document as it is stored in PlanetScale MySQL.
// It includes sensitive data like the password hash.
// This interface should primarily be used in backend (server-side) logic.
export interface IUser {
  id: string; // MySQL UUID
  username: string;
  email: string;
  password: string;
  reputation?: number;
  review_count?: number;
  created_at: string; // MySQL TIMESTAMP
  updated_at: string; // MySQL TIMESTAMP
}

// The UserProfile interface represents a "safe" version of the user object
// that can be sent to the client-side. It omits the password.
export interface UserProfile {
  id: string;
  username: string;
  email?: string; // Email is optional on a public profile
  reputation?: number;
  review_count?: number;
}

