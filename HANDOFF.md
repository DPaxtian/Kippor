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

### Monetización freemium (Kippor Pro)
- [ ] **Integrar RevenueCat** (`react-native-purchases`) como capa de IAP sobre App Store y Google Play
- [ ] **Tier gratuito** — límite de 30 pedidos por mes; al alcanzarlo se muestra el paywall
- [ ] **Tier Pro** — pedidos ilimitados + exportación PDF/CSV + notificaciones
- [ ] **Paywall** — pantalla de upgrade con opciones mensual/anual
- [ ] **Gate de features** — bloquear exportación y notificaciones si no es Pro
- [ ] **Restaurar compras** — botón en Ajustes para restaurar suscripción activa
- [ ] **Prerequisito** — crear cuenta RevenueCat, configurar productos en App Store Connect y Google Play Console, definir precios

### Soporte para tablet (iPad)
- [ ] **Layout adaptivo** — detectar tablet con breakpoint y aplicar layouts de dos columnas donde tiene sentido: lista + detalle en pedidos/historial, grid de 3-4 columnas en catálogo, contenido centrado con ancho máximo en reportes y ajustes. El diseño se definirá antes de implementar.

### Fase Corto plazo — completa ✅

### Fase Mediano plazo — Supabase + Login + Sync

**Contexto de decisión:**
- Sin login: los datos viven solo en el dispositivo. Si el usuario borra la app o cambia de teléfono, pierde todo.
- Con login: los datos se sincronizan en Supabase y están disponibles en cualquier dispositivo.
- Para cross-platform (iOS ↔ Android) el login es obligatorio — no hay otra forma de identificar al mismo usuario en ambos sistemas.

**Estrategia de autenticación (pendiente de decidir):**

| Método | iOS | Android | Cross-platform | Notas |
|---|---|---|---|---|
| Apple Sign In | ✅ | ❌ | ❌ | Apple puede ocultar el email real |
| Google Sign In | ✅ | ✅ | ✅ | Requiere cuenta Google |
| Email + contraseña | ✅ | ✅ | ✅ | Universal, más fricción |
| Magic link (email) | ✅ | ✅ | ✅ | Sin contraseña, Supabase nativo |

**Recomendación:** magic link o email/contraseña como método principal, con Apple Sign In y Google Sign In como botones de conveniencia. Es la única combinación que resuelve todos los casos incluyendo cambio de iOS a Android.

**Lo que resuelve Supabase + login:**
- [ ] **Backup automático** — si el usuario borra la app o cambia de teléfono, sus datos se restauran al iniciar sesión
- [ ] **Cross-device** — mismos datos en iPhone e iPad con el mismo login
- [ ] **Cross-platform** — mismos datos en iOS y Android
- [ ] **Vincular suscripción Pro** — RevenueCat se vincula al usuario autenticado en vez del dispositivo
- [ ] **Múltiples negocios** — cada negocio asociado a la cuenta del usuario
- [ ] **Sync offline-first** — SQLite local sigue siendo la fuente de verdad, Supabase sincroniza en background cuando hay internet

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
