"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Separator } from "@/components/ui/separator";
import { persistUserProfile } from "@/lib/firestore-users";

const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(values: LoginFormValues) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await persistUserProfile(userCredential.user);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "¡Bienvenido de vuelta!",
      });
      router.push("/"); // Redirige a inicio o dashboard
    } catch (error: any) {
      console.error("Error en el inicio de sesión", error);
      let errorMessage = "No se pudo iniciar sesión. Verificá tus credenciales.";
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        errorMessage = "Correo o contraseña incorrectos.";
      }
      toast({
        title: "Inicio de Sesión Fallido",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="space-y-4">
          <GoogleAuthButton label="Iniciar sesión con Google" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Separator className="flex-1" />
            <span>o con tu correo</span>
            <Separator className="flex-1" />
          </div>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@correo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Iniciar Sesión
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/register">Registrate</Link>
            </Button>
          </p>
        </form>
      </div>
    </Form>
  );
}