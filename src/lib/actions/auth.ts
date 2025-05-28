"use server";

import { z } from "zod";
import { auth } from "@/config/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";

// Schemas (can be co-located or imported from a shared types/schemas file)
const registerSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function registerUser(prevState: any, formData: FormData) {
  try {
    const validatedFields = registerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        message: "Invalid form data.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }
    
    const { email, password, displayName } = validatedFields.data;

    // This part would run on the server if Firebase Admin SDK was used.
    // Since we are using client SDK methods here, this action should ideally be called from a client component.
    // For a true server action with Firebase, you'd use Admin SDK to create user or custom tokens.
    // However, for this scaffold, we demonstrate the form handling logic.
    // In a real app, you'd call Firebase client SDK methods directly in the form component,
    // or use a backend API route that uses Firebase Admin SDK.

    // Placeholder for actual Firebase registration logic (client-side usually for email/password)
    // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // await updateProfile(userCredential.user, { displayName });

    console.log("Registering user:", { email, displayName });

    return { message: "Registration successful! Redirecting...", success: true };
  } catch (error: any) {
    let errorMessage = "Registration failed. Please try again.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "This email is already registered.";
    }
    return { message: errorMessage, errors: null, success: false };
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        message: "Invalid form data.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validatedFields.data;
    
    // Placeholder for actual Firebase login logic (client-side usually for email/password)
    // await signInWithEmailAndPassword(auth, email, password);

    console.log("Logging in user:", { email });

    return { message: "Login successful! Redirecting...", success: true };
  } catch (error: any) {
    let errorMessage = "Login failed. Please check your credentials.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
    }
    return { message: errorMessage, errors: null, success: false };
  }
}
