import type { CollectionConfig } from "payload"

import { DECISION_CAPABILITIES, stripUntrustedCapabilityWrite } from "@/lib/evidence/decision-auth"

/**
 * Authenticated application users. Decision capabilities are empty unless a
 * stored record already has them. This collection does not assign one.
 * Create and update access on the field is closed, and the change hook
 * restores the stored list, so a request cannot grant the capability.
 */
export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  // The first administrator is bootstrapped using Payload's guarded setup
  // flow / local seed. The public create-user REST endpoint is not signup.
  access: {
    admin: ({req}) => Boolean(req.user),
    create: ({req}) => Boolean(req.user),
    read: ({req}) => Boolean(req.user),
    update: ({req}) => Boolean(req.user),
    delete: ({req}) => Boolean(req.user),
  },
  auth: { maxLoginAttempts: 5, lockTime: 10 * 60 * 1000, tokenExpiration: 2 * 60 * 60,
    cookies: { secure: process.env.NODE_ENV === "production", sameSite: "Lax" },
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data) return data
        return stripUntrustedCapabilityWrite(data, originalDoc)
      },
    ],
  },
  fields: [
    {
      name: "evidenceDecisionCapabilities",
      type: "select",
      hasMany: true,
      required: false,
      defaultValue: [],
      saveToJWT: false,
      options: DECISION_CAPABILITIES.map((value) => ({ label: value, value })),
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        description: "Stored capability only. A user cannot grant this field to themselves.",
      },
    },
  ],
}
