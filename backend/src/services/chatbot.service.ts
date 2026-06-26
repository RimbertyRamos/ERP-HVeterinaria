/**
 * Re-export del ChatbotService refactorizado.
 *
 * El servicio fue movido a chatbot/chatbot.service.ts para separar la lógica
 * de servicio, los prompts (chatbot.prompts.ts) y los datos de primeros auxilios
 * (primeros-auxilios.data.ts). Este re-export mantiene la compatibilidad con
 * container.ts y cualquier otro import existente.
 */
export { ChatbotService } from "./chatbot/chatbot.service";
