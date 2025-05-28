import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFormWrapper
      title="Crear una Cuenta"
      description="Unite a Rueda Compartida hoy y empezá a compartir viajes."
    >
      <RegisterForm />
    </AuthFormWrapper>
  );
}