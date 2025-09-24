"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile } from "firebase/auth";

import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/config/firebase";
import { persistUserProfile } from "@/lib/firestore-users";

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  photoURL: z
    .string()
    .trim()
    .url({ message: "Ingresá una URL válida para tu foto de perfil." })
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0]!.toUpperCase())
    .join("");
};

export default function ProfilePage() {
  const { user, loading } = useAuthGuard();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      photoURL: user?.photoURL ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
      });
    }
  }, [form, user]);

  const {
    formState: { isSubmitting, isDirty },
  } = form;

  const onSubmit = async (values: ProfileFormValues) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({
        title: "No se pudo actualizar el perfil",
        description: "Iniciá sesión nuevamente e intentá otra vez.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProfile(currentUser, {
        displayName: values.displayName,
        photoURL: values.photoURL || null,
      });
      await persistUserProfile(currentUser);
      toast({
        title: "Perfil actualizado",
        description: "Tus datos personales se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      console.error("Error al actualizar el perfil", error);
      toast({
        title: "No se pudo actualizar el perfil",
        description: "Intentá nuevamente en unos instantes.",
        variant: "destructive",
      });
    }
  };

  if (loading || !user) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Mi perfil</CardTitle>
            <CardDescription>
              Actualizá tus datos personales para que otros usuarios puedan conocerte mejor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4 rounded-lg border border-dashed border-border bg-muted/40 p-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={form.watch("photoURL") || undefined} alt={user.displayName || user.email || "Usuario"} />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(user.displayName || user.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este es el avatar que verán otros usuarios.</p>
                <p className="text-xs text-muted-foreground">
                  Podés actualizar la imagen ingresando la URL de una foto en el formulario.
                </p>
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la foto de perfil</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Email</FormLabel>
                  <Input value={user.email ?? ""} disabled className="mt-2" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || !isDirty}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
