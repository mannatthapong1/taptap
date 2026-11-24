// ระบบ POS ชมรมธุรกิจ — เฟรนช์ฟรายส์เขย่า
// เก็บข้อมูลไว้ใน localStorage ของเครื่องที่ใช้ขาย (ไม่ต้องต่ออินเทอร์เน็ต)

export type Size = {
  id: string;
  name: string; // เช่น "S", "M", "L"
  label: string; // เช่น "เล็ก"
  price: number;
  active: boolean;
};

export type Flavor = {
  id: string;
  name: string; // เช่น "ชีส"
  emoji: string;
  extra: number; // ราคาบวกเพิ่ม (0 = ไม่บวก)
  active: boolean;
};

export type Settings = {
  shopName: string;
  promptPayId: string;
  sizes: Size[];
  flavors: Flavor[];
};

export type CartLine = {
  key: string; // sizeId|flavorId
  sizeId: string;
  sizeName: string;
  flavorId: string;
  flavorName: string;
  unitPrice: number;
  qty: number;
};

export type PaymentMethod = "cash" | "transfer";

export type Order = {
  id: string;
  number: number; // เลขคิวของวัน
  createdAt: string; // ISO
  lines: CartLine[];
  total: number;
  method: PaymentMethod;
  received: number;
  change: number;
  voided: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  shopName: "เฟรนช์ฟรายส์เขย่า ชมรมธุรกิจ",
  promptPayId: "",
  sizes: [
    { id: "s", name: "S", label: "เล็ก", price: 20, active: true },
    { id: "m", name: "M", label: "กลาง", price: 30, active: true },
    { id: "l", name: "L", label: "ใหญ่", price: 40, active: true },
    { id: "xl", name: "XL", label: "จัมโบ้", price: 59, active: true },
  ],
  flavors: [
    { id: "cheese", name: "ชีส", emoji: "🧀", extra: 0, active: true },
    { id: "bbq", name: "บาร์บีคิว", emoji: "🔥", extra: 0, active: true },
    { id: "sourcream", name: "ซาวร์ครีม", emoji: "🧅", extra: 0, active: true },
    { id: "seaweed", name: "สาหร่าย", emoji: "🌿", extra: 0, active: true },
    { id: "paprika", name: "ปาปริก้า", emoji: "🌶️", extra: 0, active: true },
    { id: "larb", name: "ลาบ", emoji: "🍃", extra: 0, active: true },
    { id: "mix", name: "มิกซ์ 2 รส", emoji: "✨", extra: 5, active: true },
    { id: "plain", name: "เกลือ (ธรรมดา)", emoji: "🧂", extra: 0, active: true },
  ],
};

const SETTINGS_KEY = "pos-fries:settings";
const ORDERS_KEY = "pos-fries:orders";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (เช่น โหมดไม่ระบุตัวตน)
  }
}

export const loadSettings = () => read<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);
export const loadOrders = () => read<Order[]>(ORDERS_KEY, []);
export const saveOrders = (o: Order[]) => write(ORDERS_KEY, o);

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const baht = (n: number) =>
  "฿" + n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

export const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const todayKey = () => dayKey(new Date().toISOString());

export function nextQueueNumber(orders: Order[]): number {
  const today = todayKey();
  const todays = orders.filter((o) => dayKey(o.createdAt) === today);
  return todays.reduce((m, o) => Math.max(m, o.number), 0) + 1;
}

export function ordersToCsv(orders: Order[]): string {
  const header = [
    "เลขคิว",
    "วันที่",
    "เวลา",
    "รายการ",
    "ยอดรวม",
    "ชำระโดย",
    "รับเงิน",
    "เงินทอน",
    "สถานะ",
  ];
  const rows = orders.map((o) => {
    const d = new Date(o.createdAt);
    const items = o.lines
      .map((l) => `${l.sizeName} ${l.flavorName} x${l.qty}`)
      .join(" / ");
    return [
      o.number,
      d.toLocaleDateString("th-TH"),
      d.toLocaleTimeString("th-TH"),
      items,
      o.total,
      o.method === "cash" ? "เงินสด" : "โอน/พร้อมเพย์",
      o.received,
      o.change,
      o.voided ? "ยกเลิก" : "สำเร็จ",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });
  return "﻿" + [header.join(","), ...rows].join("\n");
}
