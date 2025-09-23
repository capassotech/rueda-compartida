"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toLocalDate } from "@/lib/date";
import { useMediaQuery } from "@/hooks/use-media-query";

const searchRidesSchema = z.object({
  origin: z.string().min(1, "El origen es requerido."),
  destination: z.string().min(1, "El destino es requerido."),
  date: z.preprocess(
    (value) => {
      if (value instanceof Date) {
        return value;
      }

      if (typeof value === "string") {
        const parsed = toLocalDate(value);
        return parsed ?? value;
      }

      return value;
    },
    z.date({ required_error: "La fecha es requerida." })
  ),
});

type SearchRidesFormValues = z.infer<typeof searchRidesSchema>;

export function SearchRidesForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const dateParam = searchParams.get("date");
  const parsedDate = dateParam ? toLocalDate(dateParam) : null;

  const form = useForm<SearchRidesFormValues>({
    resolver: zodResolver(searchRidesSchema),
    defaultValues: {
      origin: searchParams.get("origin") || "",
      destination: searchParams.get("destination") || "",
      date: parsedDate ?? new Date(),
    },
  });
  const { formState: { isSubmitting } } = form;

  function onSubmit(values: SearchRidesFormValues) {
    const params = new URLSearchParams();
    params.set("origin", values.origin);
    params.set("destination", values.destination);
    params.set("date", format(values.date, "yyyy-MM-dd"));
    
    router.push(`/viajes?${params.toString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origen</FormLabel>
                <FormControl>
                  <Input placeholder="ej. Ciudad A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destino</FormLabel>
                <FormControl>
                  <Input placeholder="ej. Ciudad B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha</FormLabel>
                {isDesktop ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-10",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccioná una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setDate(new Date().getDate() - 1))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      min={format(new Date(), "yyyy-MM-dd")}
                      onChange={(event) => {
                        const nextValue = toLocalDate(event.target.value);
                        field.onChange(nextValue ?? undefined);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Buscar Viajes"}
        </Button>
      </form>
    </Form>
  );
}