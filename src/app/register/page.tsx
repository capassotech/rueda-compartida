import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFormWrapper
      title="Create an Account"
      description="Join Rueda Compartida today to start sharing rides."
    >
      <RegisterForm />
    </AuthFormWrapper>
  );
}
