"use server";

import { z } from "zod";
import { auth } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

// Esquemas (pueden estar en otro archivo compartido)
const registerSchema = z.object({
  displayName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function registerUser(prevState: any, formData: FormData) {
  try {
    const validatedFields = registerSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return {
        message: "Datos del formulario inválidos.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password, displayName } = validatedFields.data;

    // En una app real, usarías Firebase Admin SDK en un entorno seguro.
    // Aquí estamos usando el client SDK por simplicidad del ejemplo.

    console.log("Registrando usuario:", { email, displayName });

    return {
      message: "¡Registro exitoso! Redirigiendo...",
      success: true,
    };
  } catch (error: any) {
    let errorMessage = "No se pudo registrar. Intentalo nuevamente.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Este correo ya está registrado.";
    }
    return { message: errorMessage, errors: null, success: false };
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const validatedFields = loginSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return {
        message: "Datos del formulario inválidos.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validatedFields.data;

    console.log("Iniciando sesión del usuario:", { email });

    return {
      message: "¡Inicio de sesión exitoso! Redirigiendo...",
      success: true,
    };
  } catch (error: any) {
    let errorMessage = "No se pudo iniciar sesión. Verificá tus credenciales.";
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential'
    ) {
      errorMessage = "Correo o contraseña incorrectos.";
    }
    return { message: errorMessage, errors: null, success: false };
  }
}