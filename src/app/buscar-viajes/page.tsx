import { AppLayout } from "@/components/layout/app-layout";
import { SearchRidesForm } from "@/components/rides/search-rides-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchRidesPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Encontrá tu próximo viaje</CardTitle>
            <CardDescription>
              Ingresá los detalles de tu viaje para buscar viajes compartidos disponibles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchRidesForm />
          </CardContent>
        </Card>
      </div>
      {/* Las opciones de viaje se mostrarán en /viajes después de realizar la búsqueda */}
    </AppLayout>
  );
}