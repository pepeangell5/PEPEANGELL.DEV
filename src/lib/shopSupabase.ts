import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const shopSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const shopSupabase = shopSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const allowedShippingCountries = [
  "Argentina",
  "Bolivia",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "Espa\u00f1a",
  "Estados Unidos",
  "Guatemala",
  "Honduras",
  "M\u00e9xico",
  "Nicaragua",
  "Panam\u00e1",
  "Paraguay",
  "Per\u00fa",
  "Puerto Rico",
  "Rep\u00fablica Dominicana",
  "Uruguay",
  "Venezuela"
];

export const productDisplayMeta: Record<
  string,
  {
    status: string;
    board: string;
    imageAlt: string;
    parts: string[];
    note: string;
  }
> = {
  "rf-kill-esp32-devkit": {
    status: "Kit programado",
    board: "ESP32 DevKit 30 pines",
    imageAlt: "Kit RF-KILL con ESP32 DevKit 30 pines y dos modulos NRF24 PA+LNA con antenas",
    parts: [
      "ESP32-WROOM DevKit 30 pines",
      "2x nRF24L01+ PA+LNA",
      "Bus SPI compartido para ambos modulos",
      "Bateria 3V",
      "Modulo de carga",
      "Step-up a 5V",
      "Firmware RF-KILL instalado"
    ],
    note: "Formato clasico, comodo para pruebas de mesa, modificaciones y laboratorio controlado."
  },
  "rf-kill-esp32-c3-supermini": {
    status: "Kit compacto",
    board: "ESP32-C3 Super Mini",
    imageAlt: "Kit RF-KILL compacto con ESP32-C3 Super Mini y dos modulos NRF24 PA+LNA con antenas",
    parts: [
      "ESP32-C3 Super Mini",
      "2x nRF24L01+ PA+LNA",
      "Bus SPI compartido para ambos modulos",
      "Bateria 3V",
      "Modulo de carga",
      "Step-up a 5V",
      "Firmware RF-KILL instalado"
    ],
    note: "Ideal cuando buscas una placa mas pequena con arranque automatico para montajes compactos."
  }
};

export function normalizeProduct(product: Record<string, any>) {
  const meta = productDisplayMeta[product.slug] ?? {
    status: product.active ? "Disponible" : "Pausado",
    board: "Kit ESP32",
    imageAlt: product.name,
    parts: [],
    note: ""
  };

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    status: meta.status,
    board: meta.board,
    firmware: product.firmware_name ?? "",
    repoUrl: product.repository_url ?? "",
    description: product.description ?? "",
    image: product.image_url ?? "",
    imageAlt: meta.imageAlt,
    parts: meta.parts,
    note: meta.note,
    price: product.price_mxn ?? 0,
    currency: "MXN",
    stock: product.stock ?? 0,
    isAvailable: Boolean(product.active)
  };
}

export function formatMoney(amount: number | string | null | undefined, currency = "MXN") {
  const numericAmount = Number(amount ?? 0);

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(numericAmount);
}

export function statusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    admin_update: "Actualizacion",
    cancelled: "Cancelado",
    completed: "Completado",
    confirmed: "Confirmado",
    delivered: "Entregado",
    failed: "Fallido",
    in_progress: "En proceso",
    new: "Nuevo",
    not_ready: "Sin preparar",
    order_created: "Pedido creado",
    paid: "Pagado",
    pending: "Pendiente",
    pending_confirmation: "Pendiente",
    preparing: "Preparando",
    ready: "Listo",
    refunded: "Reembolsado",
    shipped: "Enviado",
    stock_released: "Stock devuelto"
  };

  return labels[status ?? ""] ?? status ?? "Sin estado";
}
