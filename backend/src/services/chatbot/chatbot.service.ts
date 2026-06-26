import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./chatbot.prompts";
import {
  PRIMEROS_AUXILIOS,
  DISCLAIMER,
  CTA,
  GENERICO,
} from "./primeros-auxilios.data";

export class ChatbotService {
  private readonly openai: OpenAI | null;

  constructor(private readonly apiKey: string) {
    // Sin clave no se construye el cliente: se usa el respaldo de primeros auxilios.
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async getEmergencyAdvice(userMessage: string, history: any[] = []) {
    if (!this.openai) {
      return this.respuestaPrimerosAuxilios(userMessage);
    }

    const mensajes: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    for (const h of history) {
      if (h?.content && String(h.content).trim() !== "") {
        mensajes.push({
          role: h.role === "user" ? "user" : "assistant",
          content: String(h.content),
        });
      }
    }
    mensajes.push({ role: "user", content: userMessage });

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: mensajes,
        temperature: 0.5,
        max_tokens: 600,
      });
      const texto = completion.choices[0]?.message?.content?.trim();
      return texto || this.respuestaPrimerosAuxilios(userMessage);
    } catch (error: any) {
      // IA no disponible (cuota/clave/red) → respaldo de primeros auxilios.
      console.error(
        "OpenAI no disponible, usando respaldo:",
        error?.message || error,
      );
      return this.respuestaPrimerosAuxilios(userMessage);
    }
  }

  /**
   * Selecciona la guía de primeros auxilios con más coincidencias de keywords.
   * Antes era una función suelta a nivel de módulo; ahora es un método privado
   * de la clase para mantener alta cohesión.
   */
  private respuestaPrimerosAuxilios(userMessage: string): string {
    const t = (userMessage || "").toLowerCase();
    // Elegimos el tema con MÁS coincidencias de palabras clave (no la primera).
    let mejor: (typeof PRIMEROS_AUXILIOS)[number] | null = null;
    let mejorPuntaje = 0;
    for (const item of PRIMEROS_AUXILIOS) {
      const puntaje = item.kw.reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0);
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejor = item;
      }
    }
    const cuerpo = mejorPuntaje > 0 && mejor ? mejor.texto : GENERICO;
    return DISCLAIMER + cuerpo + CTA;
  }
}
