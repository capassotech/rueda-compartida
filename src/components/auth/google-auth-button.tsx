"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/config/firebase";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { persistUserProfile } from "@/lib/firestore-users";

interface GoogleAuthButtonProps {
  label?: string;
}

export function GoogleAuthButton({ label = "Continuar con Google" }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider).catch(async (error: any) => {
        if (
          error?.code === "auth/popup-blocked" ||
          error?.code === "auth/operation-not-supported-in-this-environment"
        ) {
          await signInWithRedirect(auth, provider);
          return null;
        }
        throw error;
      });

      if (result?.user) {
        await persistUserProfile(result.user);
        toast({
          title: "Sesión iniciada",
          description: "Bienvenido/a a Rueda Compartida",
        });
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error con Google Auth", error);
      toast({
        title: "No se pudo iniciar sesión",
        description:
          error?.message === "Firebase: Error (auth/cancelled-popup-request)."
            ? "Se canceló la ventana emergente, intentá nuevamente."
            : "No pudimos completar la autenticación con Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={handleGoogleAuth}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2045c0-.638-.0573-1.251-.1648-1.835H9v3.47h4.844c-.2096 1.13-.8436 2.087-1.7976 2.732v2.272h2.908c1.704-1.57 2.6856-3.884 2.6856-6.639z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-0.806 5.956-2.187l-2.908-2.272c-.806.54-1.835.858-3.048.858-2.344 0-4.328-1.583-5.034-3.708H.928v2.332C2.406 15.982 5.462 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.966 10.691c-.18-.54-.282-1.116-.282-1.691s.102-1.151.282-1.691V4.977H.928C.336 6.189 0 7.56 0 9c0 1.44.336 2.811.928 4.023l3.038-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.542c1.32 0 2.508.454 3.442 1.346l2.582-2.582C13.467.806 11.43 0 9 0 5.462 0 2.406 2.018.928 4.977l3.038 2.332C4.672 5.125 6.656 3.542 9 3.542z"
        fill="#EA4335"
      />
      <path d="M0 0h18v18H0z" fill="none" />
    </svg>
  );
}
