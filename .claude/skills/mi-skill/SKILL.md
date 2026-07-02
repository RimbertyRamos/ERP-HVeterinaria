---
name: distinctive-ui
description: Usar al rediseñar o reestilizar la capa visual de la app (colores, tipografía, espaciado, estilo de componentes) para darle una identidad deliberada y profesional en vez del look genérico que la mayoría de UIs de IA/plantillas de admin produce por defecto. Para definir design tokens y reformar pantallas existentes, no para agregar funcionalidades.
---

# Identidad visual distintiva — Sistema veterinario HEV-FCV-UAGRM

Actúa como el líder de diseño que le da a este producto una identidad que no se confundiría con una plantilla de dashboard genérica. Es un sistema REAL de gestión de un hospital veterinario, usado a diario por personal (recepción, veterinarios, caja) y por propietarios de mascotas: el diseño debe seguir siendo claro, rápido y profesional para trabajo con datos, y a la vez sentirse intencional y específico de un contexto clínico-veterinario, no templado.

## Aterrízalo en el tema
Es un hospital para animales: equilibra confianza clínica (precisión, legibilidad, calma) con cuidado y calidez (se trata de mascotas y sus dueños). Que esa tensión guíe la paleta y los detalles, no la decoración porque sí. Es una herramienta densa de operaciones (tablas, formularios, POS, dashboard): la claridad y la densidad de información importan más que grandes momentos "hero".

## Evita el "look de IA"
NO entregues los defaults que hacen que una UI parezca generada por máquina:
- El look Tailwind de admin de fábrica: fondo slate-50, tarjetas blancas rounded-2xl con shadow-sm por todos lados, un único primario azul/índigo o violeta, tipografía Inter/de sistema, todo con el mismo redondeo, emojis como íconos.
- Los tres clusters de IA: (1) fondo crema + serif de alto contraste + acento terracota (~#D97757); (2) fondo casi negro + un acento verde ácido/bermellón; (3) layout tipo periódico con reglas finas y cero radio. Son defaults, no decisiones.
Elige color, tipografía y estructura para ESTE producto y justifica cada elección.

## Decisiones deliberadas (primero los tokens)
Define un sistema pequeño de design tokens y deriva TODO de ahí (theme de Tailwind + variables CSS), sin hardcodear por componente:
- Color: 5–6 valores con nombre — un primario real anclado a la marca (no el azul por defecto), neutros con una ligera temperatura (no slate puro) y colores semánticos (éxito/advertencia/peligro/info) legibles sobre datos.
- Tipografía: empareja dos tipografías reales — una display/títulos con carácter pero profesional, usada con moderación, y una de cuerpo/UI muy legible (los números deben verse limpios para precios y fechas). Escala tipográfica, pesos y tracking intencionales. La tipografía ES la personalidad; no la dejes en el default del framework.
- Espaciado y densidad: escala de espaciado consistente y una densidad de fila/tabla adecuada a datos. La precisión en el espaciado es lo que separa "diseñado" de "templado".
- Forma y profundidad: decide un radio y un lenguaje de elevación deliberados (p. ej. mayormente plano con bordes finos, o sombras suaves usadas con moderación) y aplícalo consistente, no sombra en todo.

## Moderación y una firma
Gasta la audacia en UN solo lugar (p. ej. el tratamiento del sidebar/nav, el encabezado del dashboard, o cómo se muestran los estados) y mantén el resto callado y consistente. Corta la decoración que no ayude a leer o actuar. Quita un elemento antes de terminar.


## Piso de calidad (es una app en uso)
- NO rompas funcionalidad ni cambies comportamiento: esto es solo estilo.
- Responsivo (hasta móvil) y consistente con modo oscuro si la app lo tiene.
- Accesible: contraste suficiente en texto y datos, foco de teclado visible, respeta reduce-motion. La animación, mínima y con propósito — el exceso se lee como IA.

## Copy (opcional, si lo tocas)
Nombra las cosas por lo que el usuario controla, voz activa, mayúscula solo al inicio, verbos consistentes en un flujo. Los errores dicen qué hacer; los estados vacíos invitan a actuar.