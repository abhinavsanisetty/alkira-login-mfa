import { z } from "zod";

import { OTP_LENGTH } from "@/lib/constants";

/** One schema per form, used by the form for feedback and by the mock API to
 *  parse the request body. Client and server cannot disagree about what a valid
 *  payload is. See DECISIONS.md §4. */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const mfaSchema = z.object({
  code: z
    .string()
    .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** A connector's editable fields. Shared by the rename form and the PATCH
 *  handler for the same reason the auth schemas are shared: the client and the
 *  server cannot disagree about what a valid name is. */
export const connectorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters")
    .max(40, "Use 40 characters or fewer")
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MfaInput = z.infer<typeof mfaSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ConnectorInput = z.infer<typeof connectorSchema>;
