"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { Badge } from "@/components/ui/badge"; // Import Badge component
import {
  getAllParticipants,
  getParticipantByCode,
  markAttendance,
} from "@/lib/connections";

interface SearchDialogProps {
  triggerButtonText: string;
  searchType: "nombre" | "ruc" | "codigo";
  id: string;
}

interface Participant {
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

export function SearchDialog({
  triggerButtonText,
  searchType,
  id,
}: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<
    Participant[]
  >([]);
  const [selectedParticipantCode, setSelectedParticipantCode] = useState<
    string | null
  >(null);
  const [participantDetails, setParticipantDetails] =
    useState<Participant | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  useEffect(() => {
    const fetchAllParticipants = async () => {
      try {
        const data = await getAllParticipants();
        setParticipants(data);
      } catch (error) {
        console.error("Error al obtener todos los participantes:", error);
        toast.error("Error al cargar la lista de participantes.");
      }
    };
    fetchAllParticipants();
  }, []);

  useEffect(() => {
    if (searchValue.length > 2) {
      const filtered = participants.filter((p) => {
        if (searchType === "nombre") {
          return (p.nombre || "")
            .toLowerCase()
            .includes(searchValue.toLowerCase());
        } else if (searchType === "ruc") {
          return (p.ruc || "")
            .toLowerCase()
            .includes(searchValue.toLowerCase());
        } else if (searchType === "codigo") {
          return (p.codigo || "")
            .toLowerCase()
            .includes(searchValue.toLowerCase());
        }
        return false;
      });
      setFilteredParticipants(filtered);
    } else {
      setFilteredParticipants([]);
    }
  }, [searchValue, participants, searchType]);

  const handleSelectParticipant = (participant: Participant) => {
    setSearchValue(
      searchType === "nombre"
        ? participant.nombre
        : searchType === "ruc"
        ? participant.ruc
        : participant.codigo
    );
    setSelectedParticipantCode(participant.codigo);
    setFilteredParticipants([]); // Clear suggestions
  };

  const handleSearch = async () => {
    if (!selectedParticipantCode) {
      toast.error("Por favor, seleccione un participante de la lista.");
      return;
    }
    try {
      const data = await getParticipantByCode(selectedParticipantCode);
      setParticipantDetails(data);
      toast.success("Registro encontrado");
    } catch (error) {
      console.error("Error al buscar datos:", error);
      toast.error("Registro no encontrado");
      setParticipantDetails(null);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedParticipantCode) return;

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    setIsRegistering(true);

    try {
      await markAttendance(selectedParticipantCode);
      const updatedData = await getParticipantByCode(selectedParticipantCode); // Fetch updated data
      setParticipantDetails(updatedData); // Update state with new data
      toast.success("Asistencia registrada con éxito");
    } catch (error) {
      console.error("Error al registrar la asistencia:", error);
      toast.error("Hubo un error al registrar");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSearchValue("");
    setFilteredParticipants([]);
    setSelectedParticipantCode(null);
    setParticipantDetails(null);
    setIsRegistering(false);
  };

  const formatText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full py-6 text-md">
            {triggerButtonText}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] top-[10%] translate-y-0">
          <DialogHeader>
            <DialogTitle>Buscar por {triggerButtonText}</DialogTitle>
            <DialogDescription>
              Ingrese el {triggerButtonText.toLowerCase()} para buscar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              {" "}
              {/* Added relative positioning to this container */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="search" className="text-left">
                  {triggerButtonText}
                </Label>
                <Input
                  id="search"
                  value={searchValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchValue(e.target.value);
                    setSelectedParticipantCode(null); // Clear selected code on input change
                    setParticipantDetails(null); // Clear details on input change
                  }}
                  placeholder={`Ingrese ${triggerButtonText.toLowerCase()}`}
                  autoComplete="off"
                />
              </div>
              {filteredParticipants.length > 0 && (
                <div className="absolute z-10 bg-white border border-gray-200 w-full top-full max-h-48 overflow-y-auto shadow-lg rounded-md">
                  {filteredParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelectParticipant(p)}
                    >
                      {searchType === "nombre" && p.nombre}
                      {searchType === "ruc" && p.ruc}
                      {searchType === "codigo" && p.codigo}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleSearch}>Buscar</Button>

          {participantDetails && (
            <div className="grid gap-2 py-2">
              {participantDetails.nombre && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Nombre:</Label>
                  <Label className="text-left col-span-3">
                    {participantDetails.nombre}
                  </Label>
                </div>
              )}

              {participantDetails.email && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Email:</Label>
                  <Label className="text-left col-span-3">
                    {participantDetails.email}
                  </Label>
                </div>
              )}

              {participantDetails.dias && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Días:</Label>
                  <Label className="text-left col-span-3">
                    {participantDetails.dias}
                  </Label>
                </div>
              )}

              {participantDetails.tipo_participante && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Tipo:</Label>
                  <div className="col-span-3 text-left">
                    {[
                      "ALUMNO_UNIVERSITARIO",
                      "AUSPICIADOR",
                      "AUTORIDAD",
                      "MEDIA_PARTNER",
                    ].includes(participantDetails.tipo_participante) ? (
                      <Badge className="bg-yellow-500 text-white">
                        {formatText(participantDetails.tipo_participante)}
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500 text-white">
                        {formatText(participantDetails.tipo_participante)}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {participantDetails.estado_pago && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Pago:</Label>
                  <div className="col-span-3 text-left">
                    {participantDetails.estado_pago === "CONFIRMADO" && (
                      <Badge className="bg-green-500 text-white">
                        {formatText(participantDetails.estado_pago)}
                      </Badge>
                    )}
                    {participantDetails.estado_pago === "PENDIENTE" && (
                      <Badge className="bg-yellow-500 text-white">
                        {formatText(participantDetails.estado_pago)}
                      </Badge>
                    )}
                    {participantDetails.estado_pago === "RECHAZADO" && (
                      <Badge className="bg-red-500 text-white">
                        {formatText(participantDetails.estado_pago)}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
            {participantDetails && (
              <Button
                onClick={handleMarkAttendance}
                disabled={
                  isRegistering ||
                  participantDetails.estado_pago !== "CONFIRMADO" ||
                  participantDetails.asistio === "SI"
                }
                className={
                  participantDetails.asistio === "SI"
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : participantDetails.estado_pago !== "CONFIRMADO"
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : ""
                }
              >
                {isRegistering
                  ? "Registrando..."
                  : participantDetails.asistio === "SI"
                  ? "Asistencia Marcada"
                  : participantDetails.estado_pago !== "CONFIRMADO"
                  ? "Debe Pagar Primero"
                  : "Marcar Asistencia"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
