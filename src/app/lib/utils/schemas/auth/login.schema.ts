import { z } from "zod";
import { validators } from "./validators";

export const loginSchema = z.object({
  email: validators.email,
  password: validators.password,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
