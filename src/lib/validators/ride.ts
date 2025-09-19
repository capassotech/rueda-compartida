import { z } from "zod";

export const rideFormSchema = z.object({
  origin: z.string().min(3, "El origen debe tener al menos 3 caracteres."),
  destination: z.string().min(3, "El destino debe tener al menos 3 caracteres."),
  date: z.date({ required_error: "La fecha es requerida." }),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/u, "Formato de hora inválido (HH:MM)."),
  availableSeats: z
    .coerce
    .number()
    .int("La cantidad de lugares debe ser un número entero.")
    .min(1, "Debe haber al menos 1 lugar disponible.")
    .max(10, "Máximo 10 lugares."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
});

export type RideFormValues = z.infer<typeof rideFormSchema>;
