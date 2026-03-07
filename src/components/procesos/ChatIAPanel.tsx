"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMsg {
  id?: string;
  rol: string;
  contenido: string;
  creadoEn?: string;
}

interface ChatIAPanelProps {
  procesoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatIAPanel({ procesoId, isOpen, onClose }: ChatIAPanelProps) {
  const [mensajes, setMensajes] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [historialCargado, setHistorialCargado] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history when panel opens
  useEffect(() => {
    if (!isOpen) return;
    setHistorialCargado(false);
    fetch(`/api/procesos/${procesoId}/chat`)
      .then((res) => res.json())
      .then((data: ChatMsg[]) => {
        if (Array.isArray(data)) setMensajes(data);
      })
      .catch(() => {})
      .finally(() => setHistorialCargado(true));
  }, [isOpen, procesoId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && historialCargado) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen, historialCargado]);

  const enviarMensaje = async (texto?: string) => {
    const msg = (texto || input).trim();
    if (!msg || cargando) return;

    const nuevoUser: ChatMsg = { rol: "user", contenido: msg, creadoEn: new Date().toISOString() };
    setMensajes((prev) => [...prev, nuevoUser]);
    setInput("");
    setCargando(true);

    try {
      // Build historial from last 8 exchanges (16 messages)
      const historialCompleto = [...mensajes, nuevoUser];
      const historial = historialCompleto.slice(-16).map((m) => ({
        rol: m.rol,
        contenido: m.contenido,
      }));

      const res = await fetch(`/api/procesos/${procesoId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: msg, historial }),
      });

      const data = await res.json();
      if (data.respuesta) {
        setMensajes((prev) => [
          ...prev,
          { rol: "assistant", contenido: data.respuesta, creadoEn: new Date().toISOString() },
        ]);
      } else {
        setMensajes((prev) => [
          ...prev,
          { rol: "assistant", contenido: data.error || "Error al obtener respuesta.", creadoEn: new Date().toISOString() },
        ]);
      }
    } catch {
      setMensajes((prev) => [
        ...prev,
        { rol: "assistant", contenido: "Error de conexion. Intenta de nuevo.", creadoEn: new Date().toISOString() },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sinHistorial = historialCargado && mensajes.length === 0;

  const chips = [
    "¿Cual es el valor pretendido contra el cliente?",
    "¿Cuando vence el proximo termino?",
    "Resume el estado actual del proceso",
  ];

  return (
    <div
      className={`fixed right-0 top-0 z-50 flex h-screen w-full flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 md:w-[520px] ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#008080]" />
          <div>
            <h3 className="text-sm font-semibold text-[#060606]">Asistente del Expediente</h3>
            <p className="text-xs text-gray-500">Consultas sobre este expediente</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* MESSAGES AREA */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
        {!historialCargado && (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#008080] border-t-transparent" />
          </div>
        )}

        {sinHistorial && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-[85%]">
              <Sparkles className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-[#008080]" />
              <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2 text-sm text-[#060606] whitespace-pre-wrap">
                Hola, soy el asistente IA de este expediente. Puedo responder preguntas sobre el radicado, partes, hitos, analisis y documentos vinculados. ¿En que puedo ayudarte?
              </div>
            </div>
          </div>
        )}

        {mensajes.map((msg, i) =>
          msg.rol === "user" ? (
            <div key={i} className="flex justify-end">
              <div>
                <div className="rounded-2xl rounded-tr-sm bg-[#008080] px-4 py-2 text-sm text-white max-w-[80%] ml-auto">
                  {msg.contenido}
                </div>
                <p className="mt-0.5 text-right text-xs text-gray-400">{formatTime(msg.creadoEn)}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-[#008080]" />
                  <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2 text-sm text-[#060606]">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        ul: ({children}) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                      }}
                    >
                      {msg.contenido}
                    </ReactMarkdown>
                  </div>
                </div>
                <p className="mt-0.5 ml-6 text-xs text-gray-400">{formatTime(msg.creadoEn)}</p>
              </div>
            </div>
          )
        )}

        {/* Loading indicator */}
        {cargando && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-[85%]">
              <Sparkles className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-[#008080]" />
              <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                <div className="flex gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#008080] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="inline-block h-2 w-2 rounded-full bg-[#008080] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="inline-block h-2 w-2 rounded-full bg-[#008080] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTED CHIPS */}
      {sinHistorial && !cargando && (
        <div className="flex flex-shrink-0 flex-wrap gap-2 px-4 pb-2">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => enviarMensaje(chip)}
              className="rounded-full border border-[#008080] px-3 py-1 text-xs text-[#008080] transition-colors hover:bg-teal-50"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* INPUT AREA */}
      <div className="flex flex-shrink-0 items-center gap-2 border-t border-gray-200 bg-white p-4">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta sobre este expediente..."
          disabled={cargando}
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#008080] focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={() => enviarMensaje()}
          disabled={!input.trim() || cargando}
          className="rounded-xl p-2 text-[#008080] transition-colors hover:bg-teal-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
