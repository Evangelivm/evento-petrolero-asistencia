import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"; // Default to localhost if not set

const api = axios.create({
  baseURL: API_BASE_URL,
});

export async function getParticipantByCode(code: string) {
  try {
    const res = await api.get(`/participants/codigo/${code}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener participante por código:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function markAttendance(code: string) {
  try {
    const res = await api.patch(`/participants/mark-assisted/${code}`);
    return res.data;
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    throw error;
  }
}

export async function getAllParticipants() {
  try {
    const res = await api.get("/participants/all-data");
    return res.data;
  } catch (error) {
    console.error("Error al obtener todos los participantes:", error);
    throw error;
  }
}
