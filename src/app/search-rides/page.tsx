import { AppLayout } from "@/components/layout/app-layout";
import { SearchRidesForm } from "@/components/rides/search-rides-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchRidesPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Find Your Next Ride</CardTitle>
            <CardDescription>
              Enter your travel details to search for available carpools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchRidesForm />
          </CardContent>
        </Card>
      </div>
      {/* Ride listings will be shown on /rides page after search */}
    </AppLayout>
  );
}
