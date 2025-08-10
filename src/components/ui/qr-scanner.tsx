"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import jsQR from "jsqr";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { Badge } from "@/components/ui/badge"; // Import Badge component
import { getParticipantByCode, markAttendance } from "@/lib/connections";

// -------------------------------------------------
// 1.  Reader corregido: se detiene tras la 1º lectura
// -------------------------------------------------
interface ReaderProps {
  onScan: (data: string) => void;
}

function Reader({ onScan }: ReaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    let alreadyScanned = false; // <- evita múltiples lecturas

    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1020 },
            height: { ideal: 1020 },
          },
        });

        if (aborted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = video.videoWidth * 0.5;
        canvas.height = video.videoHeight * 0.5;

        const scanQRCode = () => {
          if (aborted || alreadyScanned || video.readyState < 2) return;

          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            alreadyScanned = true; // <- importante
            if (navigator.vibrate) navigator.vibrate(100);

            setQrCodeData(code.data);
            onScan(code.data);

            // Apagamos la cámara inmediatamente
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
            }
          }
        };

        intervalRef.current = setInterval(scanQRCode, 250);
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
      }
    };

    startCamera();

    return () => {
      aborted = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [onScan]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-2/3 mx-auto border-2 border-white rounded-lg"
        autoPlay
        playsInline
        muted
      />

      {/* Marco centrado sobre el video */}
      <div className="absolute -top-4 left-0 w-full h-full flex items-center justify-center pointer-events-none">
        <div className="relative" style={{ width: "50%", aspectRatio: "1/1" }}>
          <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-2 border-l-2 border-green-500 rounded-tl-lg" />
          <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-2 border-r-2 border-green-500 rounded-tr-lg" />
          <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-2 border-l-2 border-green-500 rounded-bl-lg" />
          <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-2 border-r-2 border-green-500 rounded-br-lg" />
        </div>
      </div>

      <p className="text-center p-2 text-sm">
        {qrCodeData ? `Información: ${qrCodeData}` : "Esperando código QR..."}
      </p>
    </div>
  );
}

// -------------------------------------------------
// 2.  Tipos
// -------------------------------------------------
interface UserResponse {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  ruc: string;
  tipo_participante: string;
  dias: string;
  metodo_pago: string;
  comprobante: string | null;
  monto: number;
  estado_pago: string;
  correo_enviado: string;
  codigo: string;
  fecha_registro: string;
  fecha_pago: string;
  fecha_validacion: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  asistio?: string;
}

// -------------------------------------------------
// 3.  Componente principal
// -------------------------------------------------
function QrScanner() {
  const [code, setCode] = useState<string>("");
  const [response, setResponse] = useState<UserResponse | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false); // New state for loading

  const formatText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Registrar asistencia
  const marker = async () => {
    if (!code) return;

    if (navigator.vibrate) {
      navigator.vibrate(100); // Vibrate on button press
    }
    setIsRegistering(true); // Disable button and show loading text

    try {
      await markAttendance(code);
      const updatedData = await getParticipantByCode(code); // Fetch updated data
      setResponse(updatedData); // Update state with new data
      toast.success("Asistencia registrada con éxito");
    } catch (error) {
      console.error("Error al registrar la asistencia:", error);
      toast.error("Hubo un error al registrar");
    } finally {
      setIsRegistering(false); // Re-enable button
    }
  };

  // Buscar datos cuando cambia el código
  useEffect(() => {
    if (!code) return;

    const fetchData = async () => {
      try {
        const data = await getParticipantByCode(code);
        setResponse(data);
        toast.success("Registro encontrado");
      } catch (error) {
        console.error("Error al buscar datos:", error);
        toast.error("Registro no encontrado");
      }
    };

    fetchData();
  }, [code]);

  // Cerrar y limpiar
  const handleClose = () => {
    setIsOpen(false);
    setCode("");
    setResponse(null);
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full py-6 text-md bg-slate-400 text-white md:py-2 md:text-sm"
            onClick={() => setIsOpen(true)}
          >
            Escanear Código QR
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px] top-[10%] translate-y-0">
          <DialogHeader>
            <DialogTitle>Lector QR</DialogTitle>
            <DialogDescription>
              Acerque la cámara al código QR dentro del margen
            </DialogDescription>
          </DialogHeader>

          {isOpen && (
            <Suspense fallback={<div>Cargando el lector...</div>}>
              <Reader
                onScan={(raw: string) => {
                  const cleaned = raw.replace(/^"|"$/g, "");
                  setCode(cleaned);
                }}
              />
            </Suspense>
          )}

          <div className="grid gap-2 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nombre:</Label>
              <Label className="text-left col-span-3">
                {response?.nombre || "Esperando datos..."}
              </Label>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email:</Label>
              <Label className="text-left col-span-3">
                {response?.email || "Esperando datos..."}
              </Label>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Días:</Label>
              <Label className="text-left col-span-3">
                {response?.dias || "Esperando datos..."}
              </Label>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tipo:</Label>
              <div className="col-span-3 text-left">
                {response?.tipo_participante ? (
                  [
                    "ALUMNO_UNIVERSITARIO",
                    "AUSPICIADOR",
                    "AUTORIDAD",
                    "MEDIA_PARTNER",
                  ].includes(response.tipo_participante) ? (
                    <Badge className="bg-yellow-500 text-white">
                      {formatText(response.tipo_participante)}
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500 text-white">
                      {formatText(response.tipo_participante)}
                    </Badge>
                  )
                ) : (
                  "Esperando datos..."
                )}
              </div>
            </div>

            {response?.estado_pago && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Pago:</Label>
                <div className="col-span-3 text-left">
                  {response.estado_pago === "CONFIRMADO" && (
                    <Badge className="bg-green-500 text-white">
                      {formatText(response.estado_pago)}
                    </Badge>
                  )}
                  {response.estado_pago === "PENDIENTE" && (
                    <Badge className="bg-yellow-500 text-white">
                      {formatText(response.estado_pago)}
                    </Badge>
                  )}
                  {response.estado_pago === "RECHAZADO" && (
                    <Badge className="bg-red-500 text-white">
                      {formatText(response.estado_pago)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
            {response && (
              <Button
                onClick={marker}
                disabled={
                  isRegistering ||
                  response.estado_pago !== "CONFIRMADO" ||
                  response.asistio === "SI"
                }
                className={
                  response.asistio === "SI"
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : response.estado_pago !== "CONFIRMADO"
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : ""
                }
              >
                {isRegistering
                  ? "Registrando..."
                  : response.asistio === "SI"
                  ? "Asistencia Marcada"
                  : response.estado_pago !== "CONFIRMADO"
                  ? "Debe Pagar Primero"
                  : "Registrar Asistencia"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QrScanner;
