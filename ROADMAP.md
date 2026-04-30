# Kippor — Roadmap

App de gestión interna para empresarios (no se comparte nada con clientes finales). Backend será Supabase (no iCloud) para soportar iOS y Android con sync cross-platform.

## Fase Inmediata ✓
- ✅ Editar pedidos
- ✅ Historial — tab propia con pedidos agrupados por día, búsqueda y filtros
- ✅ Búsqueda — por cliente en Historial (suficiente para los pedidos de hoy por ser pocos)

## Extras completados (no estaban en el roadmap original)
- ✅ Selector de estado de entrega en formulario de nuevo/editar pedido
- ✅ Selector de moneda global (9 monedas LATAM + USD/EUR) con persistencia
- ✅ Símbolo de moneda en inputs de precio
- ✅ Persistencia de preferencias (tema, color, moneda, nombre negocio) con AsyncStorage
- ✅ Etiquetas personalizables — crear/editar/eliminar desde Ajustes, asignar a pedidos, filtrar en Historial y Reportes
- ✅ Exportación PDF/CSV desde modal en Ajustes
- ✅ Notificaciones — recordatorio de pedidos pendientes del día

## Próximas features (pendientes)

### ~~Exportación mejorada (Pro)~~ ✅
- ~~Mover exportación de PDF a la sección de Reportes (feature core de suscripción Pro, no debe estar escondida en Ajustes)~~
- ~~Exportar por etiquetas además de por rango de fechas (consistente con el filtro por etiquetas que ya existe en Reportes)~~

### ~~Onboarding~~ ✅
- ~~Modal de bienvenida/tutorial al abrir la app por primera vez~~
- ~~Guiar al usuario a registrar productos antes de crear pedidos~~
- ~~Solo se muestra una vez~~

### ~~Módulo de gastos~~ ✅
- ~~Registrar gastos del negocio (renta, ingredientes, etc.)~~
- ~~Calcular ganancia neta en reportes (ingresos - gastos)~~

## Fase Mediano plazo
- Backup/sync con Supabase — cross-platform iOS+Android, SQLite local sigue siendo fuente de verdad, Supabase como respaldo en segundo plano, app funciona 100% offline
- Múltiples negocios — si el empresario maneja más de un negocio
