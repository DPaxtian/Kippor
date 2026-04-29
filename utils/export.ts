import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getDatabase } from '@/db/database';
import { getOrders } from '@/db/orders';
import { getSalesSummary, getTopProducts } from '@/db/reports';
import { formatCurrency, formatShortDate } from '@/utils/format';
import type { Order } from '@/types';

export interface ExportOptions {
  from: string;
  to: string;
  businessName: string;
  currency: string;
  accentColor: string;
  accentSoft: string;
  isDark: boolean;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: 'Pagado',
  unpaid: 'Por cobrar',
};

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  delivered: 'Entregado',
  pending: 'Por entregar',
};

export async function exportCSV(opts: ExportOptions): Promise<void> {
  const db = await getDatabase();
  const orders = await getOrders(db, { from: opts.from, to: opts.to });

  const headers = [
    'ID', 'Fecha', 'Cliente', 'Dirección', 'Envío',
    'Costo envío', 'Estado entrega', 'Método pago',
    'Estado cobro', 'Subtotal', 'Total', 'Notas',
  ];

  const rows = orders.map((o: Order) => [
    o.id,
    formatShortDate(o.created_at),
    o.client_name,
    o.client_address ?? '',
    o.has_delivery ? 'Sí' : 'No',
    o.shipping_cost,
    DELIVERY_STATUS_LABEL[o.delivery_status] ?? o.delivery_status,
    PAYMENT_METHOD_LABEL[o.payment_method] ?? o.payment_method,
    PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status,
    o.subtotal,
    o.total,
    o.notes ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  const fromLabel = format(new Date(opts.from), 'ddMMyyyy');
  const toLabel = format(new Date(opts.to), 'ddMMyyyy');
  const filename = `kippor_pedidos_${fromLabel}-${toLabel}.csv`;
  const path = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function getLogoBase64(): Promise<string | null> {
  try {
    const uri = require('@/assets/images/Kippor_logo.png');
    // expo-asset resolves the local path
    const { Asset } = await import('expo-asset');
    const asset = Asset.fromModule(uri);
    await asset.downloadAsync();
    if (!asset.localUri) return null;
    const b64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${b64}`;
  } catch {
    return null;
  }
}

export async function exportPDF(opts: ExportOptions): Promise<void> {
  const db = await getDatabase();
  const [orders, summary, topProducts] = await Promise.all([
    getOrders(db, { from: opts.from, to: opts.to }),
    getSalesSummary(db, opts.from, opts.to),
    getTopProducts(db, opts.from, opts.to),
  ]);

  const logoBase64 = await getLogoBase64();

  const fromStr = format(new Date(opts.from), "d 'de' MMMM, yyyy", { locale: es });
  const toStr = format(new Date(opts.to), "d 'de' MMMM, yyyy", { locale: es });
  const periodLabel = fromStr === toStr ? fromStr : `${fromStr} — ${toStr}`;
  const generatedAt = format(new Date(), "d MMM yyyy · HH:mm", { locale: es });

  const fmt = (v: number) => formatCurrency(v, opts.currency);

  const bg = opts.isDark ? '#171311' : '#FAF7F4';
  const bgElevated = opts.isDark ? '#211C19' : '#FFFFFF';
  const bgMuted = opts.isDark ? '#2A231F' : '#F2EDE8';
  const border = opts.isDark ? '#332A26' : '#E8E0D8';
  const contentColor = opts.isDark ? '#F4EDE7' : '#1F1815';
  const contentMuted = opts.isDark ? '#B8ADA5' : '#6B5D54';
  const contentSubtle = opts.isDark ? '#7A6E66' : '#9A8A80';
  const warnBg = opts.isDark ? '#2B2010' : '#FBF1D9';
  const warnColor = opts.isDark ? '#E5B257' : '#B47A1C';
  const successBg = opts.isDark ? '#1A2A1C' : '#E5F2E4';
  const successColor = opts.isDark ? '#7BB97A' : '#4F8F5C';
  const accent = opts.accentColor;
  const accentSoft = opts.accentSoft;

  const maxQty = topProducts.length > 0 ? topProducts[0].totalQuantity : 1;

  const topProductsHtml = topProducts.length === 0 ? '' : `
    <div class="section">
      <div class="section-label">Más vendidos</div>
      <div class="card" style="padding:0; overflow:hidden;">
        ${topProducts.map((p, i) => `
          <div class="product-row" style="${i < topProducts.length - 1 ? `border-bottom:1px solid ${border};` : ''}">
            <div class="rank-badge" style="background:${accentSoft}; color:${accent};">${i + 1}</div>
            <div class="product-info">
              <div class="product-name">${p.product_name}</div>
              <div class="bar-track" style="background:${border};">
                <div class="bar-fill" style="width:${Math.round((p.totalQuantity / maxQty) * 100)}%; background:${accent};"></div>
              </div>
            </div>
            <div class="product-stats">
              <div class="product-qty">${p.totalQuantity}</div>
              <div class="product-rev">${fmt(p.totalRevenue)}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;

  const ordersHtml = orders.length === 0
    ? `<p style="text-align:center; color:${contentMuted}; padding:24px 0;">Sin pedidos en este período.</p>`
    : `
    <div class="section">
      <div class="section-label">Pedidos (${orders.length})</div>
      <div class="card" style="padding:0; overflow:hidden;">
        <table class="orders-table">
          <thead>
            <tr>
              <th>#</th><th>Fecha</th><th>Cliente</th><th>Método</th>
              <th>Cobro</th><th>Entrega</th><th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((o: Order, i: number) => {
              const isPaid = o.payment_status === 'paid';
              const isDelivered = o.delivery_status === 'delivered';
              return `<tr style="${i % 2 === 1 ? `background:${bgMuted};` : ''}">
                <td>${o.id}</td>
                <td>${formatShortDate(o.created_at)}</td>
                <td style="font-weight:600;">${o.client_name}</td>
                <td>${PAYMENT_METHOD_LABEL[o.payment_method] ?? o.payment_method}</td>
                <td><span class="badge" style="background:${isPaid ? successBg : warnBg}; color:${isPaid ? successColor : warnColor};">${isPaid ? 'Pagado' : 'Por cobrar'}</span></td>
                <td><span class="badge" style="background:${isDelivered ? successBg : warnBg}; color:${isDelivered ? successColor : warnColor};">${isDelivered ? 'Entregado' : 'Pendiente'}</span></td>
                <td style="text-align:right; font-weight:700;">${fmt(o.total)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" style="height:36px; object-fit:contain;" />`
    : `<span style="font-size:18px; font-weight:800; color:${accent};">Kippor</span>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: ${bg};
    color: ${contentColor};
    font-size: 13px;
    line-height: 1.5;
    padding: 32px 28px;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid ${border};
  }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .header-business {
    font-size: 18px;
    font-weight: 700;
    color: ${contentColor};
  }
  .header-period {
    font-size: 11px;
    color: ${contentColor};
    margin-top: 2px;
  }
  .header-right { text-align: right; }
  .header-generated {
    font-size: 10px;
    color: ${contentColor};
  }

  /* Hero */
  .hero {
    background: ${accent};
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 16px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
  .hero-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #fff;
    margin-bottom: 4px;
  }
  .hero-amount {
    font-size: 36px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .hero-sub {
    font-size: 12px;
    color: #fff;
    margin-top: 4px;
  }
  .hero-orders {
    text-align: right;
    color: #fff;
  }
  .hero-orders-num {
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }
  .hero-orders-label {
    font-size: 11px;
    color: #fff;
    margin-top: 3px;
  }

  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }
  .stat-card {
    background: ${bgElevated};
    border: 1px solid ${border};
    border-radius: 14px;
    padding: 14px 16px;
  }
  .stat-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${contentMuted};
    margin-bottom: 4px;
  }
  .stat-value {
    font-size: 22px;
    font-weight: 800;
    color: ${contentColor};
    line-height: 1.1;
  }
  .stat-sub {
    font-size: 10px;
    margin-top: 2px;
  }
  .stat-warn .stat-label,
  .stat-warn .stat-value { color: ${warnColor}; }
  .stat-warn .stat-sub { color: ${warnColor}; opacity: 0.7; }
  .stat-warn { background: ${warnBg}; border-color: ${warnColor}33; }

  /* Section */
  .section { margin-bottom: 20px; }
  .section-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: ${contentMuted};
    margin-bottom: 8px;
    padding-left: 2px;
  }
  .card {
    background: ${bgElevated};
    border: 1px solid ${border};
    border-radius: 14px;
    padding: 16px;
  }

  /* Top products */
  .product-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
  }
  .rank-badge {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .product-info { flex: 1; min-width: 0; }
  .product-name {
    font-size: 13px;
    font-weight: 600;
    color: ${contentColor};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bar-track {
    height: 5px;
    border-radius: 3px;
    margin-top: 5px;
    overflow: hidden;
  }
  .bar-fill { height: 100%; border-radius: 3px; }
  .product-stats { text-align: right; flex-shrink: 0; }
  .product-qty { font-size: 13px; font-weight: 700; color: ${contentColor}; }
  .product-rev { font-size: 11px; color: ${contentColor}; margin-top: 1px; }

  /* Orders table */
  .orders-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .orders-table th {
    padding: 10px 12px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${contentMuted};
    background: ${bgMuted};
    border-bottom: 1px solid ${border};
  }
  .orders-table td {
    padding: 9px 12px;
    color: ${contentColor};
    border-bottom: 1px solid ${border};
    vertical-align: middle;
  }
  .orders-table tr:last-child td { border-bottom: none; }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Footer */
  .footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid ${border};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-brand {
    font-size: 11px;
    font-weight: 700;
    color: ${accent};
    letter-spacing: 0.05em;
  }
  .footer-note {
    font-size: 10px;
    color: ${contentSubtle};
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div>
        <div class="header-business">${opts.businessName}</div>
        <div class="header-period">${periodLabel}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="header-generated">Generado el ${generatedAt}</div>
    </div>
  </div>

  <!-- Hero -->
  <div class="hero">
    <div>
      <div class="hero-label">Ingresos del período</div>
      <div class="hero-amount">${fmt(summary.totalRevenue)}</div>
      <div class="hero-sub">Ticket promedio: ${fmt(summary.avgOrderValue)}</div>
    </div>
    <div class="hero-orders">
      <div class="hero-orders-num">${summary.totalOrders}</div>
      <div class="hero-orders-label">pedidos</div>
    </div>
  </div>

  <!-- Stats grid -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Cobrados</div>
      <div class="stat-value">${summary.paidCount}</div>
      <div class="stat-sub" style="color:${successColor};">pedidos pagados</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Ticket promedio</div>
      <div class="stat-value" style="font-size:18px;">${fmt(summary.avgOrderValue)}</div>
    </div>
    <div class="stat-card stat-warn">
      <div class="stat-label">Por cobrar</div>
      <div class="stat-value">${summary.unpaidCount}</div>
      <div class="stat-sub">pedidos pendientes</div>
    </div>
    <div class="stat-card stat-warn">
      <div class="stat-label">Por entregar</div>
      <div class="stat-value">${summary.pendingDeliveries}</div>
      <div class="stat-sub">envíos pendientes</div>
    </div>
  </div>

  ${topProductsHtml}
  ${ordersHtml}

  <!-- Footer -->
  <div class="footer">
    <span class="footer-brand">KIPPOR</span>
    <span class="footer-note">Reporte generado automáticamente · ${opts.businessName}</span>
  </div>

</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const fromLabel = format(new Date(opts.from), 'ddMMyyyy');
  const toLabel = format(new Date(opts.to), 'ddMMyyyy');
  const filename = `kippor_reporte_${fromLabel}-${toLabel}.pdf`;
  const dest = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.moveAsync({ from: uri, to: dest });
  await Sharing.shareAsync(dest, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
