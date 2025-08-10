import QrScannerDialog from "@/components/ui/qr-scanner";
import { SearchDialog } from "@/components/ui/search-dialog";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Asistencia</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <SearchDialog
          triggerButtonText="Nombre"
          searchType="nombre"
          id="nombre-id"
        />

        <SearchDialog triggerButtonText="RUC" searchType="ruc" id="ruc-id" />

        <SearchDialog
          triggerButtonText="Código"
          searchType="codigo"
          id="codigo-id"
        />

        <QrScannerDialog />
      </div>
    </div>
  );
}
