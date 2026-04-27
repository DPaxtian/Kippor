# Kippor — Plan MVP

## Contexto

Kippor es una app móvil para vendedores minoristas (principalmente home-based, como venta de postres). El problema central: los vendedores llevan el registro de pedidos en libretas físicas y calculan sus ventas manualmente. La app reemplaza eso con un catálogo de productos, registro de pedidos y reportes de ventas con filtros por período.

**Stack:** React Native + Expo 54, expo-router 6, TypeScript strict, SQLite local, Zustand.  
**Base de datos:** Local únicamente (sin backend para MVP).  
**Plataforma destino:** iOS + Android (App Store + Google Play).

---

## Decisiones de diseño confirmadas

| Aspecto | Decisión |
|---|---|
| Estado de entrega | Simple: `pending` / `delivered` |
| Items por pedido | Múltiples productos con cantidad |
| Estado de pago | `unpaid` / `paid` |
| Método de pago | `cash` / `card` / `transfer` |
| Catálogo | Nombre + precio + descripción + imagen |
| Estilos | NativeWind (Tailwind CSS para React Native) |
| UI | Español, dark/light mode |

---

## Modelo de datos (SQLite)

```sql
products:      id, name, price, description, image_uri, is_active (soft-delete), created_at
orders:        id, client_name, client_address, has_delivery, shipping_cost,
               delivery_status, payment_status, payment_method,
               notes, subtotal, total, created_at
order_items:   id, order_id (CASCADE DELETE), product_id (SET NULL),
               product_name*, product_price*, quantity, subtotal
```
`payment_method`: `'cash'` | `'card'` | `'transfer'` (default `'cash'`)  
*Snapshot: el historial no cambia si se edita el producto.

---

## Estructura de archivos a crear

```
db/
  database.ts          ← init, WAL mode, FK enforcement, migrations
  products.ts          ← CRUD productos
  order-items.ts       ← CRUD items
  orders.ts            ← CRUD órdenes con transacciones
  reports.ts           ← queries de agregación para reportes

store/
  products-store.ts    ← Zustand: lista de productos
  orders-store.ts      ← Zustand: pedidos, pedido seleccionado
  ui-store.ts          ← Zustand: filtros de reportes

utils/
  format.ts            ← formatCurrency(), formatDate()
  dates.ts             ← getDateRange(period) con date-fns/es

types/
  index.ts             ← Product, Order, OrderItem, SalesSummary, etc.

components/
  orders/
    OrderCard.tsx
    OrderStatusBadge.tsx
  catalog/
    ProductCard.tsx
  reports/
    SummaryCard.tsx
    DateRangePicker.tsx

app/
  _layout.tsx          ← MODIFICAR: GestureHandlerRootView + initDatabase()
  (tabs)/
    _layout.tsx        ← MODIFICAR: 4 tabs (Pedidos, Catálogo, Reportes, Ajustes)
    index.tsx          ← REEMPLAZAR: lista de pedidos de hoy
    catalog.tsx        ← NUEVO
    reports.tsx        ← NUEVO
    settings.tsx       ← NUEVO
  orders/
    new.tsx            ← Formulario nuevo pedido (modal)
    [id].tsx           ← Detalle / editar pedido
  catalog/
    new.tsx            ← Formulario nuevo producto (modal)
    [id].tsx           ← Editar producto
```

---

## Fases de implementación

### Fase 0 — Bootstrap ✅
1. Instalar dependencias:
   - `npx expo install expo-sqlite expo-image-picker`
   - `npm install zustand date-fns`
   - `npm install nativewind` + `npm install --save-dev tailwindcss`
2. Configurar NativeWind:
   - Crear `tailwind.config.js` apuntando a `app/**`, `components/**`
   - Agregar preset `nativewind/babel` en `babel.config.js`
   - Actualizar `metro.config.js` con el withNativeWind wrapper
   - Agregar `/// <reference types="nativewind/types" />` en `expo-env.d.ts`
3. Agregar plugins en `app.json`: `expo-image-picker` (permisos cámara/fotos) y `expo-sqlite`
4. Definir paleta de colores en `tailwind.config.js` (primary, success, warning, error, surface)
5. Agregar íconos faltantes en `components/ui/icon-symbol.tsx`: cart, label, bar-chart, settings
6. Los componentes `ThemedText` y `ThemedView` existentes **no se usarán** en pantallas nuevas — reemplazar con `<Text className="...">` y `<View className="...">`

### Fase 1 — Capa de base de datos ✅
Orden de implementación (cada archivo depende del anterior):

1. **`db/database.ts`** — Lo más crítico:
   - `openDatabaseAsync('kippor.db')`
   - `PRAGMA journal_mode = WAL` + `PRAGMA foreign_keys = ON`
   - Sistema de migraciones con `PRAGMA user_version`
   - Migración v1: crea las 3 tablas
   - Exporta `initDatabase()` y `getDatabase()` (singleton cacheado)

2. **`db/products.ts`** — `getAllProducts`, `getProductById`, `createProduct`, `updateProduct`, `softDeleteProduct`

3. **`db/order-items.ts`** — `getItemsByOrderId`, `createOrderItem`, `deleteItemsByOrderId`

4. **`db/orders.ts`** — `getOrders(filters?)`, `getTodaysOrders`, `getOrderById`, `createOrder` (transacción), `updateOrder` (transacción), `updateOrderStatus`, `deleteOrder`

5. **`db/reports.ts`** — `getSalesSummary(from, to)`, `getTopProducts(from, to)`

### Fase 2 — Stores Zustand ✅
1. **`store/products-store.ts`** — `products[]`, `fetchProducts`, `addProduct`, `updateProduct`, `deleteProduct`
2. **`store/orders-store.ts`** — `orders[]`, `selectedOrder`, `fetchTodaysOrders`, `fetchOrdersByRange`, `createOrder`, `updateOrder`, `updateOrderStatus`, `deleteOrder`
3. **`store/ui-store.ts`** — `reportPeriod`, `reportDateRange`, setters

### Fase 3 — Shell de navegación ✅
1. **`app/_layout.tsx`** — Envolver con `GestureHandlerRootView`, `useEffect` para `initDatabase()`, mostrar nada hasta `dbReady = true`
2. **`app/(tabs)/_layout.tsx`** — 4 tabs con íconos y títulos en español

### Fase 4 — Componentes compartidos ✅
1. `OrderStatusBadge.tsx` — badge de estado de entrega/pago
2. `OrderCard.tsx` — tarjeta resumen de pedido con toggle rápido de estado
3. `ProductCard.tsx` — tarjeta de producto con imagen/placeholder
4. `SummaryCard.tsx` — métrica (label + valor)
5. `DateRangePicker.tsx` — selector Hoy/Semana/Mes/Año/Personalizado

### Fase 5 — Pantallas de Catálogo ✅
1. `app/(tabs)/catalog.tsx` — FlatList + FAB + `useFocusEffect` para refrescar
2. `app/catalog/new.tsx` — Formulario modal (nombre, precio, descripción, imagen)
3. `app/catalog/[id].tsx` — Editar + eliminar con confirmación

### Fase 6 — Pantallas de Pedidos ✅
1. `app/(tabs)/index.tsx` — Lista de hoy + FAB + `useFocusEffect`
2. `app/orders/new.tsx` — Formulario complejo con `useReducer` local:
   - Sección cliente (nombre, dirección, toggle envío, costo envío)
   - Sección productos (selector de producto del catálogo, stepper de cantidad, subtotal)
   - Sección estado (entrega, método de pago: efectivo/tarjeta/transferencia, estado de pago: pagado/no pagado, notas)
   - Footer con total corriente y botón guardar
3. `app/orders/[id].tsx` — Detalle + modo edición + eliminar

### Fase 7 — Pantalla de Reportes ✅
- `app/(tabs)/reports.tsx`:
  - `DateRangePicker` en la parte superior (controlado por `ui-store`)
  - `useEffect` → recalcula al cambiar rango → llama `getSalesSummary` + `getTopProducts`
  - Grid de `SummaryCard`: ingresos totales, nº pedidos, promedio, pendientes de cobro, pendientes de entrega
  - Lista de productos más vendidos

### Fase 8 — Ajustes ✅
- `app/(tabs)/settings.tsx` — Info de la app (versión via `expo-constants`), opción "Borrar todos los datos" con confirmación destructiva

### Fase 9 — Polish ✅
- Indicadores de carga (`ActivityIndicator`) mientras `isLoading = true`
- Estados vacíos en las 3 listas
- `utils/format.ts`: `formatCurrency()` con `Intl.NumberFormat`, `formatDate()` con `date-fns/es`

---

## Decisiones técnicas clave

| Tema | Decisión | Razón |
|---|---|---|
| Estilos | NativeWind (Tailwind) — no ThemedText/ThemedView | Consistencia visual, utility-first |
| API de expo-sqlite | Async (`openDatabaseAsync`, `runAsync`, etc.) | Requerida por New Architecture |
| Transacciones | `db.withTransactionAsync()` | Atomicidad en creación/edición de pedidos |
| Fechas en DB | ISO 8601 strings | SQLite sin tipo date; strings ISO ordenan lexicográficamente |
| State del formulario | `useReducer` local (no Zustand) | Estado efímero, solo existe mientras el form está abierto |
| Refresco de listas | `useFocusEffect` + re-fetch tras mutación | Simple y correcto a esta escala |
| Imágenes | URI local del picker, sin copiar | Suficiente para MVP; URIs son estables en el sandbox |
| Soft-delete productos | `is_active = 0` | Preserva snapshots en pedidos históricos |
| Locale semana | `date-fns` con `{ locale: es }` | Semana inicia lunes (convención latinoamericana) |

---

## Verificación (cómo probar el MVP completo)

1. **Catálogo:**
   - Crear producto con foto → aparece en la lista
   - Editar precio → el cambio se refleja en pedidos nuevos, no en históricos
   - Eliminar producto → desaparece del catálogo, sigue visible en pedidos anteriores

2. **Pedidos:**
   - Crear pedido con 2+ productos → total calculado correctamente
   - Crear pedido con envío → total = subtotal + costo envío
   - Marcar como pagado/entregado desde la lista sin abrir el detalle
   - Editar pedido existente → items y totales se actualizan

3. **Reportes:**
   - Crear pedidos en días distintos → filtrar por Hoy, Semana, Mes
   - Total de ingresos coincide con suma manual
   - Producto más vendido aparece primero en la lista

4. **Persistencia:**
   - Cerrar y reabrir la app → todos los datos se mantienen
   - Probar en iOS y Android
