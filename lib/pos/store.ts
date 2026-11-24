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
  extra: number; // ราคาบวกเพิ่ม (0 = ไม่บวก / ฟรี)
  active: boolean;
};

export type Settings = {
  shopName: string;
  promptPayId: string;
  igHandle: string;
  sizes: Size[];
  flavors: Flavor[]; // ผงเขย่า (เลือก 1)
  sauces: Flavor[]; // ซอส (เลือกได้หลายอย่าง)
  drawings: string[]; // โปร 2: รูปที่วาดด้วยซอส
  upsizePromo: boolean; // โปร 1: กดติดตาม อัปไซซ์ฟรี
};

export type CartLine = {
  key: string; // sizeId|flavorId
  sizeId: string;
  sizeName: string;
  flavorId: string;
  flavorName: string;
  sauces: string[]; // ชื่อซอสที่เลือก
  upsized: boolean; // โปร 1: ได้อัปไซซ์ฟรี (sizeName = ขนาดที่ได้รับจริง)
  paidSizeName?: string; // ขนาดที่จ่ายเงินจริง ถ้าอัปไซซ์
  drawing: string; // โปร 2: รูปวาดซอส ("" = ไม่มี)
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
  shopName: "Fry & Fizz",
  promptPayId: "",
  igHandle: "Businessclub.space",
  sizes: [
    { id: "s", name: "S", label: "เล็ก", price: 40, active: true },
    { id: "m", name: "M", label: "กลาง", price: 50, active: true },
  ],
  flavors: [
    { id: "cheese", name: "ชีส", emoji: "🧀", extra: 0, active: true },
    { id: "bbq", name: "บาร์บีคิว", emoji: "🔥", extra: 0, active: true },
    { id: "nori", name: "โนริสาหร่าย", emoji: "🌿", extra: 0, active: true },
  ],
  sauces: [
    { id: "ketchup", name: "ซอสมะเขือเทศ", emoji: "🍅", extra: 0, active: true },
    { id: "mayo", name: "มายองเนส", emoji: "🥚", extra: 0, active: true },
    { id: "cheese-sauce", name: "ชีส", emoji: "🧀", extra: 0, active: true },
  ],
  drawings: [
    "ดอกไม้",
    "หัวใจ",
    "ยิ้ม :)",
    "ดาว",
    "ก้นหอย @",
    "#",
    "คนซื้อ",
    "หมา & แมว",
  ],
  upsizePromo: true,
};

const SETTINGS_KEY = "pos-fries:settings:v2";
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

export const loadSettings = (): Settings => ({
  ...DEFAULT_SETTINGS,
  ...read<Partial<Settings>>(SETTINGS_KEY, {}),
});
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

/** คำอธิบายเพิ่มเติมของรายการ เช่น ซอส / โปรโมชัน */
export function lineExtras(l: CartLine): string[] {
  const out: string[] = [];
  if (l.sauces?.length) out.push(`ซอส: ${l.sauces.join(", ")}`);
  else out.push("ไม่ใส่ซอส");
  if (l.upsized) out.push(`🎁 อัปไซซ์ฟรี (จ่ายราคา ${l.paidSizeName ?? ""})`);
  if (l.drawing) out.push(`🎨 วาดซอสรูป${l.drawing}`);
  return out;
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
      .map(
        (l) =>
          `${l.sizeName} ${l.flavorName} x${l.qty} [${lineExtras(l).join("; ")}]`
      )
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
