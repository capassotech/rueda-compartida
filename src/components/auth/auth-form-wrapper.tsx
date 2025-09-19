import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';

interface AuthFormWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthFormWrapper({ title, description, children }: AuthFormWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-primary">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Car className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Rueda Compartida</h1>
          <p className="text-sm text-muted-foreground">Movete con confianza, sumate a la comunidad.</p>
        </div>
      </div>
      <Card className="w-full max-w-sm border border-border/60 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">{title}</CardTitle>
          <CardDescription className="text-pretty text-sm text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Rueda Compartida
      </p>
    </div>
  );
}