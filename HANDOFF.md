# Kippor — Handoff

## Estado actual: Localización completa ✅

La app está funcional con todas las features de Fase Inmediata y Fase Corto plazo implementadas, más soporte completo de localización en 3 idiomas.

---

## Lo que está construido

### Stack
- React Native + Expo 54, expo-router 6, TypeScript strict
- SQLite local (expo-sqlite) + Zustand
- NativeWind (Tailwind CSS para RN)

### Features implementadas
- **Pedidos** — crear, ver detalle, editar, eliminar; toggle de estado (entregado/pagado) desde la tarjeta; summary strip (ingresos hoy, por entregar, por cobrar)
- **Historial** — tab dedicada con 90 días de pedidos agrupados por día, búsqueda por cliente, filtros por estado y etiqueta
- **Catálogo** — grid 2 columnas, emoji picker, soporte de fotos (cámara + galería), editar y eliminar productos
- **Reportes** — selector de período, hero card con sparkline, métricas, top productos con barras de progreso, comparativo vs período anterior, filtro por etiqueta
- **Etiquetas** — CRUD completo, asignables a pedidos, filtrables en historial y reportes
- **Exportar pedidos** — PDF con diseño de marca (logo, hero card, stats, tabla de pedidos) y CSV para hoja de cálculo; selector de período (hoy/semana/mes/año); share sheet nativo
- **Localización** — español, inglés y portugués nativos; detección automática del idioma del dispositivo; selector en Ajustes; date-fns alineado con el idioma activo; ~160 strings traducidas incluyendo tabs, pantallas, alertas, notificaciones y modales
- **Pedidos programados** — toggle "Programar pedido" con fecha de entrega (date picker) y adelanto recibido; detalle muestra saldo pendiente con alerta visual
- **Notificaciones** — matutina diaria (resumen de pendientes), nocturna diaria (cierre del día con ingresos); ambas configurables en hora desde Ajustes; notificación de entrega automática por pedido programado
- **Ajustes** — nombre del negocio editable, tema oscuro funcional, selector de 4 colores accent (Terracota, Rosa, Miel, Oliva), selector de moneda (9 monedas LATAM), borrar todos los datos con doble confirmación

### Sistema de diseño
- Paleta terracota warm-leaning con tokens light/dark
- Dark mode conectado a `colorScheme` de NativeWind — cambia en tiempo real
- 4 paletas de accent que cambian toda la app (tab bar, headers, botones, FABs, avatares, etc.)
- Fuente del accent: `useAccentColor()` hook + `constants/palette.ts`

### Arquitectura de datos
- DB SQLite con migraciones (`db/database.ts`, `LATEST_VERSION = 3`)
- Migración 1: tablas `products`, `orders`, `order_items`
- Migración 2: columna `emoji TEXT` en `products`
- Migración 3: tablas `labels`, `order_labels`
- Migración 4: columnas `delivery_date TEXT` y `advance_payment REAL` en `orders`
- Stores Zustand: `orders-store`, `products-store`, `ui-store`, `labels-store`
- `ui-store` maneja: `reportPeriod`, `reportDateRange`, `colorScheme`, `accentPalette`, `businessName`, `currency`

---

## Lo que falta (ver ROADMAP.md)

### Fase Corto plazo — completa ✅

### Fase Mediano plazo
- [ ] **Backup y sync con Supabase** — SQLite local como fuente de verdad, sync en background cuando hay internet
- [ ] **Múltiples negocios** — soporte para gestionar más de un negocio desde la misma app

### Fase A futuro
- [ ] **Widget iOS/Android de pedido rápido** — crear pedido desde pantalla de inicio sin abrir la app
- [ ] **Widget de ganancias del día** — ver ingresos del día desde pantalla de inicio
- [ ] **Widget de pedidos pendientes** — ver pendientes de entrega/cobro desde pantalla de inicio

---

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `db/database.ts` | Init DB, migraciones |
| `db/orders.ts` | CRUD pedidos |
| `db/reports.ts` | Queries de reportes + sparkline + comparativo |
| `db/labels.ts` | CRUD etiquetas y order_labels |
| `store/ui-store.ts` | Theme, accent, nombre negocio, moneda, períodos |
| `constants/palette.ts` | 4 paletas de color con valores light/dark |
| `hooks/use-accent-color.ts` | Hook para obtener color accent activo |
| `app/(tabs)/index.tsx` | Tab pedidos del día |
| `app/(tabs)/history.tsx` | Tab historial 90 días |
| `app/orders/new.tsx` | Formulario nuevo pedido |
| `app/orders/[id].tsx` | Detalle pedido |
| `app/orders/edit.tsx` | Formulario edición pedido |
| `app/(tabs)/reports.tsx` | Reportes con comparativo real |
| `app/labels.tsx` | Gestión de etiquetas |
| `utils/export.ts` | Generación de PDF (expo-print) y CSV (expo-file-system/legacy) |
| `utils/notifications.ts` | Lógica de notificaciones: matutina, nocturna y por entrega de pedido |
| `i18n/index.ts` | Configuración de i18next y detección de idioma del dispositivo |
| `i18n/es.ts` · `en.ts` · `pt.ts` | Archivos de traducción: español, inglés y portugués |
| `hooks/use-locale.ts` | Hook que devuelve el locale de date-fns según el idioma activo |
| `components/ui/ExportModal.tsx` | Modal de exportación con selector de formato y período |

---

## Pendientes técnicos
- **Nuevo build requerido** — se agregaron `expo-print`, `expo-sharing`, `expo-notifications` y `expo-localization`; hay que correr `eas build --profile development --platform ios` (o `run:ios`) para que todo funcione en dispositivo
- La cámara no funciona en simulador (limitación de iOS Simulator, no un bug)
