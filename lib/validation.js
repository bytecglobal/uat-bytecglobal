import { z } from "zod";

// Disallow newline and carriage return characters to prevent email header injection
const noCrlf = (val) => !/[\r\n\u0085\u2028\u2029]/.test(val) && !/%0[ad]/i.test(val);

export const ContactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100, { message: "Name cannot exceed 100 characters." })
    .refine(noCrlf, { message: "Name contains invalid newline characters." }),

  email: z
    .string()
    .trim()
    .min(5, { message: "Email is required." })
    .max(100, { message: "Email cannot exceed 100 characters." })
    .email({ message: "Please provide a valid email address." })
    .refine(noCrlf, { message: "Email contains invalid newline characters." }),

  phone: z
    .string()
    .trim()
    .max(30, { message: "Phone number cannot exceed 30 characters." })
    .refine(noCrlf, { message: "Phone number contains invalid characters." })
    .optional()
    .or(z.literal("")),

  service: z
    .string()
    .trim()
    .max(100, { message: "Service selection cannot exceed 100 characters." })
    .refine(noCrlf, { message: "Service contains invalid characters." })
    .optional()
    .or(z.literal("")),

  budget: z
    .string()
    .trim()
    .max(50, { message: "Budget range cannot exceed 50 characters." })
    .refine(noCrlf, { message: "Budget contains invalid characters." })
    .optional()
    .or(z.literal("")),

  timeline: z
    .string()
    .trim()
    .max(50, { message: "Timeline cannot exceed 50 characters." })
    .refine(noCrlf, { message: "Timeline contains invalid characters." })
    .optional()
    .or(z.literal("")),

  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters." })
    .max(3000, { message: "Message cannot exceed 3000 characters." }),

  // Honeypot field - must remain empty for human submissions
  website: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
});
