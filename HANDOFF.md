# Kippor — Handoff

## Estado actual: MVP completo ✅

La app está funcional y con builds de preview generadas para iOS y Android vía EAS.

---

## Lo que está construido

### Stack
- React Native + Expo 54, expo-router 6, TypeScript strict
- SQLite local (expo-sqlite) + Zustand
- NativeWind (Tailwind CSS para RN)

### Features implementadas
- **Pedidos** — crear, ver detalle, eliminar; toggle de estado (entregado/pagado) desde la tarjeta; summary strip (ingresos hoy, por entregar, por cobrar)
- **Catálogo** — grid 2 columnas, emoji picker, soporte de fotos (cámara + galería)
- **Reportes** — selector de período, hero card con sparkline, métricas, top productos con barras de progreso, comparativo vs período anterior calculado con datos reales
- **Ajustes** — nombre del negocio editable, tema oscuro funcional, selector de 4 colores accent (Terracota, Rosa, Miel, Oliva), borrar todos los datos con doble confirmación

### Sistema de diseño
- Paleta terracota warm-leaning con tokens light/dark
- Dark mode conectado a `colorScheme` de NativeWind — cambia en tiempo real
- 4 paletas de accent que cambian toda la app (tab bar, headers, botones, FABs, avatares, etc.)
- Fuente del accent: `useAccentColor()` hook + `constants/palette.ts`

### Arquitectura de datos
- DB SQLite con migraciones (`db/database.ts`, `LATEST_VERSION = 2`)
- Migración 1: tablas `products`, `orders`, `order_items`
- Migración 2: columna `emoji TEXT` en `products`
- Stores Zustand: `orders-store`, `products-store`, `ui-store`
- `ui-store` maneja: `reportPeriod`, `reportDateRange`, `colorScheme`, `accentPalette`, `businessName`

---

## Lo que falta (ver ROADMAP.md)

### Próximo a implementar — Fase Inmediata
- [ ] **Editar pedidos** — la pantalla `app/orders/[id].tsx` tiene un botón "Editar" en el header que es no-op; hay que conectarlo a un formulario de edición (reusar lógica de `app/orders/new.tsx`)
- [ ] **Historial** — `fetchTodaysOrders()` solo trae pedidos de hoy; hay que agregar navegación por fecha o un listado histórico
- [ ] **Búsqueda** — filtrar pedidos por nombre de cliente en la tab de Pedidos

### Notas para continuar
- El botón "Editar" en el header de `app/orders/[id].tsx` ya existe pero llama a `router.back()` — hay que crear `app/orders/edit/[id].tsx` o reusar `new.tsx` con un `initial` prop
- `getOrders()` en `db/orders.ts` acepta filtros `{ from, to }` — ya está lista para historial
- El store `orders-store` tiene `fetchOrdersByRange(from, to)` — listo para usar en historial
- Para búsqueda, lo más simple es un `useState` de filtro local sobre los pedidos ya cargados

---

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `db/database.ts` | Init DB, migraciones |
| `db/orders.ts` | CRUD pedidos |
| `db/reports.ts` | Queries de reportes + sparkline + comparativo |
| `store/ui-store.ts` | Theme, accent, nombre negocio, períodos |
| `constants/palette.ts` | 4 paletas de color con valores light/dark |
| `hooks/use-accent-color.ts` | Hook para obtener color accent activo |
| `app/(tabs)/index.tsx` | Tab pedidos |
| `app/orders/new.tsx` | Formulario nuevo pedido (modal) |
| `app/orders/[id].tsx` | Detalle pedido — botón Editar pendiente |
| `app/(tabs)/reports.tsx` | Reportes con comparativo real |
| `components/reports/DateRangePicker.tsx` | Selector de período + date picker nativo |

---

## Pendientes técnicos menores
- Build de dev/preview desactualizada — se agregó `@react-native-community/datetimepicker` después del último build; hay que correr `eas build --profile preview --platform all` de nuevo para que el date picker funcione en dispositivo
- La cámara no funciona en simulador (limitación de iOS Simulator, no un bug)
