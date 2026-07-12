// ---------------------------------------------------------------------------
// Fastify request augmentation — populated after session validation
// ---------------------------------------------------------------------------

export interface AuthUserPayload {
  userId: string;
  email: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Route-specific response types
// ---------------------------------------------------------------------------

/** Used by the /me endpoint (see auth.service.ts for the full shape) */
export interface AuthMeResponse {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  type: string | null;
  avatar: string | null;
  phone_number: string | null;
  created_at: Date;
}
