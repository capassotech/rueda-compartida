import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthFormWrapper
      title="¡Bienvenido de Vuelta!"
      description="Iniciá sesión en tu cuenta de Rueda Compartida."
    >
      <LoginForm />
    </AuthFormWrapper>
  );
}