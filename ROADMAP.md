# Kippor — Roadmap

App de gestión interna para que el empresario lleve sus finanzas y pedidos. No hay componente de cara al cliente final.

---

## Fase Inmediata

- **Editar pedidos** — modificar cliente, productos, método de pago y estado de un pedido existente
- **Historial** — ver pedidos de días anteriores, no solo los de hoy
- **Búsqueda** — encontrar pedidos por nombre de cliente

---

## Fase Corto plazo

- **Exportar CSV/PDF** — generar un reporte de pedidos o ventas por período para contabilidad externa
- **Notificaciones** — recordatorio diario de pedidos pendientes de entrega o cobro

---

## Fase Mediano plazo

- **Backup y sync con Supabase** — respaldo en la nube cross-platform (iOS + Android); SQLite local sigue siendo la fuente de verdad para uso offline, Supabase sincroniza en segundo plano cuando hay internet
- **Múltiples negocios** — soporte para que el empresario gestione más de un negocio desde la misma app

---

## Fase A futuro

- **Widgets para iOS y Android** — accesos directos desde la pantalla de inicio sin abrir la app:
  - Widget de creación rápida de pedido
  - Widget de ganancias del día
  - Widget de pedidos pendientes

---

> El orden de implementación está pensado para no tocar la arquitectura de datos hasta que las features principales estén maduras. Supabase se implementa después de las fases inmediata y corto plazo.
