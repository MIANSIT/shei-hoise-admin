import { z } from "zod";

export const validators = {
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .regex(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      "Invalid email format"
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
};
