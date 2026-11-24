"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings as SettingsIcon,
  Minus,
  Plus,
  Trash2,
  X,
  Banknote,
  Smartphone,
  CheckCircle2,
  Download,
  RotateCcw,
} from "lucide-react";
import {
  CartLine,
  DEFAULT_SETTINGS,
  Flavor,
  Order,
  PaymentMethod,
  Settings,
  baht,
  dayKey,
  lineExtras,
  loadOrders,
  loadSettings,
  nextQueueNumber,
  ordersToCsv,
  saveOrders,
  saveSettings,
  todayKey,
  uid,
} from "@/lib/pos/store";

type Tab = "sell" | "history" | "summary" | "settings";

export default function PosApp() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("sell");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    // โหลดข้อมูลจากเครื่องหลัง mount เพื่อไม่ให้ hydration ไม่ตรงกัน
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadSettings());
    setOrders(loadOrders());
    setReady(true);
  }, []);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };
  const updateOrders = (o: Order[]) => {
    setOrders(o);
    saveOrders(o);
  };

  const todaysOrders = orders.filter(
    (o) => dayKey(o.createdAt) === todayKey() && !o.voided
  );
  const todayTotal = todaysOrders.reduce((s, o) => s + o.total, 0);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 text-amber-700">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-amber-50 text-gray-900">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-white shadow">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🍟</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">{settings.shopName}</h1>
            <p className="text-xs opacity-90">ชมรมธุรกิจ · ระบบขายหน้าร้าน</p>
          </div>
        </div>
        <div className="shrink-0 whitespace-nowrap text-right">
          <p className="text-xs opacity-90">ยอดขายวันนี้</p>
          <p className="text-lg font-bold">
            {baht(todayTotal)}{" "}
            <span className="text-xs font-normal">({todaysOrders.length} บิล)</span>
          </p>
        </div>
      </header>

      <main className="flex-1 pb-20">
        {tab === "sell" && (
          <SellView
            settings={settings}
            cart={cart}
            setCart={setCart}
            orders={orders}
            onPaid={(order) => updateOrders([order, ...orders])}
          />
        )}
        {tab === "history" && (
          <HistoryView orders={orders} updateOrders={updateOrders} />
        )}
        {tab === "summary" && <SummaryView orders={orders} />}
        {tab === "settings" && (
          <SettingsView
            settings={settings}
            updateSettings={updateSettings}
            clearOrders={() => updateOrders([])}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-amber-200 bg-white">
        {(
          [
            ["sell", "ขาย", ShoppingCart],
            ["history", "บิลขาย", Receipt],
            ["summary", "สรุปยอด", BarChart3],
            ["settings", "ตั้งค่า", SettingsIcon],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              tab === id ? "text-orange-600" : "text-gray-500"
            }`}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ------------------------------ หน้าขาย ------------------------------ */

function SellView({
  settings,
  cart,
  setCart,
  orders,
  onPaid,
}: {
  settings: Settings;
  cart: CartLine[];
  setCart: (c: CartLine[]) => void;
  orders: Order[];
  onPaid: (o: Order) => void;
}) {
  const sizes = settings.sizes.filter((s) => s.active);
  const flavors = settings.flavors.filter((f) => f.active);
  const sauces = settings.sauces.filter((f) => f.active);
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  const [flavorId, setFlavorId] = useState("");
  const [sauceIds, setSauceIds] = useState<string[]>([]);
  const [upsize, setUpsize] = useState(false);
  const [drawing, setDrawing] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState<Order | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0];
  const flavor = flavors.find((f) => f.id === flavorId);
  const sizeIdx = sizes.findIndex((s) => s.id === size?.id);
  const upsizeTo = settings.upsizePromo ? sizes[sizeIdx + 1] : undefined;
  const pickedSauces = sauces.filter((x) => sauceIds.includes(x.id));
  const itemPrice =
    (size?.price ?? 0) +
    (flavor?.extra ?? 0) +
    pickedSauces.reduce((s, x) => s + x.extra, 0);
  const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const resetItem = () => {
    setFlavorId("");
    setSauceIds([]);
    setUpsize(false);
    setDrawing("");
  };

  const add = () => {
    if (!size || !flavor) return;
    const served = upsize && upsizeTo ? upsizeTo : size;
    const sauceNames = pickedSauces.map((x) => x.name);
    const isUp = served.id !== size.id;
    const key = [served.id, size.id, flavor.id, sauceIds.slice().sort().join("+"), drawing].join("|");
    const existing = cart.find((l) => l.key === key);
    if (existing) {
      setCart(cart.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)));
    } else {
      setCart([
        ...cart,
        {
          key,
          sizeId: served.id,
          sizeName: `${served.name} (${served.label})`,
          flavorId: flavor.id,
          flavorName: flavor.name,
          sauces: sauceNames,
          upsized: isUp,
          paidSizeName: isUp ? size.name : undefined,
          drawing,
          unitPrice: itemPrice,
          qty: 1,
        },
      ]);
    }
    resetItem();
  };

  const changeQty = (key: string, delta: number) =>
    setCart(
      cart
        .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );

  const pay = (method: PaymentMethod, received: number) => {
    const order: Order = {
      id: uid(),
      number: nextQueueNumber(orders),
      createdAt: new Date().toISOString(),
      lines: cart,
      total,
      method,
      received,
      change: Math.max(0, received - total),
      voided: false,
    };
    onPaid(order);
    setCart([]);
    setCheckout(false);
    setCartOpen(false);
    setDone(order);
  };

  if (sizes.length === 0 || flavors.length === 0) {
    return (
      <p className="p-6 text-center text-gray-600">
        ยังไม่มีขนาดหรือรสชาติที่เปิดขาย — ไปที่แท็บ “ตั้งค่า” เพื่อเพิ่ม
      </p>
    );
  }

  const cartPanel = (
    <CartPanel
      cart={cart}
      total={total}
      changeQty={changeQty}
      clear={() => setCart([])}
      onCheckout={() => setCheckout(true)}
    />
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 pb-24 lg:grid-cols-[1fr_360px] lg:pb-4">
      <section className="space-y-5">
        <div>
          <h2 className="mb-2 font-bold text-gray-700">1. เลือกขนาด</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSizeId(s.id);
                  setUpsize(false);
                }}
                className={`rounded-2xl border-2 p-3 text-center transition active:scale-95 ${
                  size?.id === s.id
                    ? "border-orange-500 bg-orange-500 text-white shadow-lg"
                    : "border-amber-200 bg-white hover:border-orange-300"
                }`}
              >
                <div className="text-2xl font-extrabold">{s.name}</div>
                <div className="text-sm">{s.label}</div>
                <div className="mt-1 text-lg font-bold">{baht(s.price)}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-bold text-gray-700">2. เลือกรสชาติ</h2>
          <div className="grid grid-cols-3 gap-3">
            {flavors.map((f) => (
              <button
                key={f.id}
                onClick={() => setFlavorId(f.id)}
                className={`rounded-2xl border-2 p-3 text-center transition active:scale-95 ${
                  flavorId === f.id
                    ? "border-orange-500 bg-orange-50 ring-2 ring-orange-300"
                    : "border-amber-200 bg-white hover:border-orange-300"
                }`}
              >
                <div className="text-3xl">{f.emoji}</div>
                <div className="mt-1 font-semibold">{f.name}</div>
                {f.extra > 0 && (
                  <div className="text-sm text-orange-600">+{baht(f.extra)}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {sauces.length > 0 && (
          <div>
            <h2 className="mb-2 font-bold text-gray-700">
              3. เลือกซอส{" "}
              <span className="font-normal text-gray-500">(เลือกได้หลายอย่าง)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {sauces.map((x) => {
                const on = sauceIds.includes(x.id);
                return (
                  <button
                    key={x.id}
                    onClick={() =>
                      setSauceIds(
                        on ? sauceIds.filter((i) => i !== x.id) : [...sauceIds, x.id]
                      )
                    }
                    className={`rounded-full border-2 px-4 py-2 font-medium transition active:scale-95 ${
                      on
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-amber-200 bg-white"
                    }`}
                  >
                    {x.emoji} {x.name}{" "}
                    <span className={on ? "text-white/80" : "text-green-600"}>
                      {x.extra > 0 ? `+${x.extra}` : "ฟรี"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(upsizeTo || settings.drawings.length > 0) && (
          <div className="space-y-3 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 p-4">
            <h2 className="font-bold text-purple-700">4. โปรโมชัน (ถ้าลูกค้าทำ)</h2>
            {upsizeTo && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-purple-600"
                  checked={upsize}
                  onChange={(e) => setUpsize(e.target.checked)}
                />
                <span>
                  <b>โปร 1:</b> กดติดตาม IG → อัปไซซ์ฟรี{" "}
                  <span className="text-purple-700">
                    ({size?.name} → {upsizeTo.name} จ่าย {baht(size?.price ?? 0)})
                  </span>
                </span>
              </label>
            )}
            {settings.drawings.length > 0 && (
              <div className="rounded-xl bg-white p-3">
                <p className="mb-2">
                  <b>โปร 2:</b> ลงสตอรี่แท็ก IG {settings.igHandle} → วาดซอสเป็นรูป
                </p>
                <div className="flex flex-wrap gap-2">
                  {settings.drawings.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => setDrawing(drawing === d ? "" : d)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition active:scale-95 ${
                        drawing === d
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-purple-200 bg-white"
                      }`}
                    >
                      {i + 1}. {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          disabled={!flavor}
          onClick={add}
          className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-bold text-white shadow-lg transition active:scale-[0.98] disabled:bg-gray-300 disabled:shadow-none"
        >
          {flavor
            ? `+ เพิ่ม ${upsize && upsizeTo ? upsizeTo.name : size?.name} ${flavor.name} ลงตะกร้า · ${baht(itemPrice)}`
            : "เลือกรสชาติก่อน"}
        </button>
      </section>

      {/* ตะกร้า: ด้านข้างบนจอใหญ่ */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">{cartPanel}</div>
      </aside>

      {/* ตะกร้า: แถบล่างบนมือถือ */}
      {count > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-20 z-20 flex items-center justify-between rounded-2xl bg-orange-500 px-5 py-4 text-white shadow-xl lg:hidden"
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingCart size={20} /> {count} ถุง
          </span>
          <span className="text-lg font-bold">{baht(total)} ›</span>
        </button>
      )}
      {cartOpen && (
        <Modal onClose={() => setCartOpen(false)} title="ตะกร้า">
          {cartPanel}
        </Modal>
      )}

      {checkout && (
        <CheckoutModal
          total={total}
          promptPayId={settings.promptPayId}
          onClose={() => setCheckout(false)}
          onPay={pay}
        />
      )}

      {done && (
        <Modal onClose={() => setDone(null)} title="ชำระเงินสำเร็จ">
          <div className="space-y-3 text-center">
            <CheckCircle2 className="mx-auto text-green-500" size={64} />
            <p className="text-gray-600">เลขคิว</p>
            <p className="text-6xl font-extrabold text-orange-600">
              #{done.number}
            </p>
            <div className="rounded-xl bg-gray-50 p-3 text-left text-sm">
              {done.lines.map((l) => (
                <div key={l.key} className="mb-1">
                  <div className="flex justify-between">
                    <span>
                      {l.sizeName} {l.flavorName} × {l.qty}
                    </span>
                    <span>{baht(l.unitPrice * l.qty)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{lineExtras(l).join(" · ")}</p>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                <span>รวม</span>
                <span>{baht(done.total)}</span>
              </div>
              {done.method === "cash" && (
                <>
                  <div className="flex justify-between">
                    <span>รับเงิน</span>
                    <span>{baht(done.received)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-600">
                    <span>เงินทอน</span>
                    <span>{baht(done.change)}</span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setDone(null)}
              className="w-full rounded-xl bg-orange-500 py-3 text-lg font-bold text-white"
            >
              ออเดอร์ถัดไป
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CartPanel({
  cart,
  total,
  changeQty,
  clear,
  onCheckout,
}: {
  cart: CartLine[];
  total: number;
  changeQty: (key: string, d: number) => void;
  clear: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">รายการสั่ง</h2>
        {cart.length > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-1 text-sm text-red-500"
          >
            <Trash2 size={16} /> ล้าง
          </button>
        )}
      </div>
      {cart.length === 0 ? (
        <p className="py-8 text-center text-gray-400">ยังไม่มีรายการ</p>
      ) : (
        <ul className="divide-y">
          {cart.map((l) => (
            <li key={l.key} className="flex items-center gap-2 py-2">
              <div className="flex-1">
                <p className="font-medium">
                  {l.flavorName}{" "}
                  <span className="text-sm text-gray-500">{l.sizeName}</span>
                </p>
                {lineExtras(l).map((t) => (
                  <p key={t} className="text-xs text-gray-500">{t}</p>
                ))}
                <p className="text-sm text-gray-500">{baht(l.unitPrice)} / ถุง</p>
              </div>
              <button
                onClick={() => changeQty(l.key, -1)}
                className="rounded-full bg-gray-100 p-1.5"
                aria-label="ลด"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-bold">{l.qty}</span>
              <button
                onClick={() => changeQty(l.key, 1)}
                className="rounded-full bg-orange-100 p-1.5 text-orange-600"
                aria-label="เพิ่ม"
              >
                <Plus size={16} />
              </button>
              <span className="w-16 text-right font-semibold">
                {baht(l.unitPrice * l.qty)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between border-t pt-3 text-xl font-bold">
        <span>รวม</span>
        <span className="text-orange-600">{baht(total)}</span>
      </div>
      <button
        disabled={cart.length === 0}
        onClick={onCheckout}
        className="mt-3 w-full rounded-xl bg-green-500 py-4 text-lg font-bold text-white disabled:bg-gray-300"
      >
        ชำระเงิน
      </button>
    </div>
  );
}

function CheckoutModal({
  total,
  promptPayId,
  onClose,
  onPay,
}: {
  total: number;
  promptPayId: string;
  onClose: () => void;
  onPay: (m: PaymentMethod, received: number) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [received, setReceived] = useState("");
  const recv = Number(received) || 0;
  const change = recv - total;
  const quick = Array.from(
    new Set([total, ...[20, 50, 100, 500, 1000].filter((v) => v > total)])
  ).slice(0, 5);

  return (
    <Modal onClose={onClose} title="ชำระเงิน">
      <div className="space-y-4">
        <div className="rounded-xl bg-orange-50 p-4 text-center">
          <p className="text-sm text-gray-600">ยอดที่ต้องชำระ</p>
          <p className="text-4xl font-extrabold text-orange-600">{baht(total)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMethod("cash")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold ${
              method === "cash"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200"
            }`}
          >
            <Banknote size={20} /> เงินสด
          </button>
          <button
            onClick={() => setMethod("transfer")}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold ${
              method === "transfer"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200"
            }`}
          >
            <Smartphone size={20} /> โอน / พร้อมเพย์
          </button>
        </div>

        {method === "cash" ? (
          <>
            <div>
              <label className="mb-1 block text-sm text-gray-600">รับเงินมา</label>
              <input
                type="number"
                inputMode="decimal"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-right text-2xl font-bold outline-none focus:border-green-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {quick.map((v) => (
                <button
                  key={v}
                  onClick={() => setReceived(String(v))}
                  className="rounded-lg bg-gray-100 py-2 font-semibold hover:bg-gray-200"
                >
                  {v === total ? "พอดี" : baht(v)}
                </button>
              ))}
            </div>
            <div
              className={`flex justify-between rounded-xl p-3 text-xl font-bold ${
                change >= 0 && recv > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <span>เงินทอน</span>
              <span>{recv > 0 && change >= 0 ? baht(change) : "-"}</span>
            </div>
            <button
              disabled={recv < total}
              onClick={() => onPay("cash", recv)}
              className="w-full rounded-xl bg-green-500 py-4 text-lg font-bold text-white disabled:bg-gray-300"
            >
              {recv > 0 && recv < total
                ? `ขาดอีก ${baht(total - recv)}`
                : "ยืนยันรับเงิน"}
            </button>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              {promptPayId ? (
                <>
                  <p className="text-sm text-gray-600">พร้อมเพย์</p>
                  <p className="text-2xl font-bold tracking-wider text-blue-700">
                    {promptPayId}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  (ตั้งค่าเลขพร้อมเพย์ได้ที่แท็บ “ตั้งค่า”)
                </p>
              )}
              <p className="mt-2 text-sm text-gray-600">
                ตรวจสอบสลิปให้ยอดตรง {baht(total)} ก่อนกดยืนยัน
              </p>
            </div>
            <button
              onClick={() => onPay("transfer", total)}
              className="w-full rounded-xl bg-blue-500 py-4 text-lg font-bold text-white"
            >
              ได้รับเงินโอนแล้ว
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------ ประวัติบิล ------------------------------ */

function HistoryView({
  orders,
  updateOrders,
}: {
  orders: Order[];
  updateOrders: (o: Order[]) => void;
}) {
  const [day, setDay] = useState(todayKey());
  const list = orders.filter((o) => dayKey(o.createdAt) === day);

  const toggleVoid = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    const msg = o.voided
      ? `กู้คืนบิล #${o.number}?`
      : `ยกเลิกบิล #${o.number} (${baht(o.total)})?`;
    if (!confirm(msg)) return;
    updateOrders(orders.map((x) => (x.id === id ? { ...x, voided: !x.voided } : x)));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">บิลขาย</h2>
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
        />
      </div>
      {list.length === 0 && (
        <p className="py-10 text-center text-gray-400">ไม่มีบิลในวันนี้</p>
      )}
      {list.map((o) => (
        <div
          key={o.id}
          className={`rounded-2xl bg-white p-4 shadow-sm ${o.voided ? "opacity-50" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-orange-600">
                #{o.number}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(o.createdAt).toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  o.method === "cash"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {o.method === "cash" ? "เงินสด" : "โอน"}
              </span>
              {o.voided && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                  ยกเลิก
                </span>
              )}
            </div>
            <span className={`text-lg font-bold ${o.voided ? "line-through" : ""}`}>
              {baht(o.total)}
            </span>
          </div>
          <ul className="mt-2 text-sm text-gray-600">
            {o.lines.map((l) => (
              <li key={l.key}>
                • {l.sizeName} {l.flavorName} × {l.qty}
                <span className="text-xs text-gray-400"> ({lineExtras(l).join(" · ")})</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-right">
            <button
              onClick={() => toggleVoid(o.id)}
              className="inline-flex items-center gap-1 text-sm text-red-500"
            >
              {o.voided ? (
                <>
                  <RotateCcw size={14} /> กู้คืน
                </>
              ) : (
                <>
                  <X size={14} /> ยกเลิกบิล
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ สรุปยอด ------------------------------ */

function SummaryView({ orders }: { orders: Order[] }) {
  const [day, setDay] = useState(todayKey());
  const [allTime, setAllTime] = useState(false);

  const list = useMemo(
    () =>
      orders.filter(
        (o) => !o.voided && (allTime || dayKey(o.createdAt) === day)
      ),
    [orders, day, allTime]
  );

  const total = list.reduce((s, o) => s + o.total, 0);
  const cash = list.filter((o) => o.method === "cash").reduce((s, o) => s + o.total, 0);
  const transfer = total - cash;
  const cups = list.reduce((s, o) => s + o.lines.reduce((a, l) => a + l.qty, 0), 0);

  const bySize = new Map<string, { qty: number; amount: number }>();
  const byFlavor = new Map<string, { qty: number; amount: number }>();
  const bySauce = new Map<string, number>();
  const byDrawing = new Map<string, number>();
  let upsized = 0;
  for (const o of list) {
    for (const l of o.lines) {
      for (const sc of l.sauces ?? []) bySauce.set(sc, (bySauce.get(sc) ?? 0) + l.qty);
      if (l.drawing) byDrawing.set(l.drawing, (byDrawing.get(l.drawing) ?? 0) + l.qty);
      if (l.upsized) upsized += l.qty;
      const s = bySize.get(l.sizeName) ?? { qty: 0, amount: 0 };
      s.qty += l.qty;
      s.amount += l.qty * l.unitPrice;
      bySize.set(l.sizeName, s);
      const f = byFlavor.get(l.flavorName) ?? { qty: 0, amount: 0 };
      f.qty += l.qty;
      f.amount += l.qty * l.unitPrice;
      byFlavor.set(l.flavorName, f);
    }
  }

  const exportCsv = () => {
    const src = orders.filter((o) => allTime || dayKey(o.createdAt) === day);
    const blob = new Blob([ordersToCsv(src)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ยอดขาย-${allTime ? "ทั้งหมด" : day}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">สรุปยอดขาย</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={allTime}
              onChange={(e) => setAllTime(e.target.checked)}
            />
            ทั้งหมด
          </label>
          <input
            type="date"
            value={day}
            disabled={allTime}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="ยอดขายรวม" value={baht(total)} accent />
        <Stat label="จำนวนบิล" value={String(list.length)} />
        <Stat label="จำนวนถุง" value={String(cups)} />
        <Stat
          label="เฉลี่ย/บิล"
          value={baht(list.length ? Math.round(total / list.length) : 0)}
        />
        <Stat label="เงินสด" value={baht(cash)} />
        <Stat label="โอน/พร้อมเพย์" value={baht(transfer)} />
        <Stat label="🎁 ใช้โปรอัปไซซ์" value={`${upsized} ถุง`} />
        <Stat
          label="🎨 ใช้โปรวาดซอส"
          value={`${[...byDrawing.values()].reduce((a, b) => a + b, 0)} ถุง`}
        />
      </div>

      <Breakdown
        title="ตามขนาด (ถุงที่ใช้จริง รวมอัปไซซ์)"
        rows={[...bySize.entries()].map(([name, v]) => ({ name, ...v }))}
      />
      <Breakdown
        title="ตามรสชาติ (ขายดี)"
        rows={[...byFlavor.entries()]
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.qty - a.qty)}
      />
      <Breakdown
        title="ซอสที่ใช้ (นับถุง — ไว้เช็กสต็อก)"
        rows={[...bySauce.entries()]
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty)}
      />
      <Breakdown
        title="รูปวาดซอสยอดฮิต (โปร 2)"
        rows={[...byDrawing.entries()]
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty)}
      />

      <button
        onClick={exportCsv}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-orange-300 bg-white py-3 font-semibold text-orange-600"
      >
        <Download size={18} /> ดาวน์โหลดไฟล์ Excel (CSV)
      </button>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ${
        accent ? "bg-orange-500 text-white" : "bg-white"
      }`}
    >
      <p className={`text-xs ${accent ? "opacity-90" : "text-gray-500"}`}>{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; qty: number; amount?: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.qty));
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="flex justify-between text-sm">
                <span>{r.name}</span>
                <span className="text-gray-600">
                  {r.qty} ถุง{r.amount !== undefined && ` · ${baht(r.amount)}`}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-amber-100">
                <div
                  className="h-2 rounded-full bg-orange-400"
                  style={{ width: `${(r.qty / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------ ตั้งค่า ------------------------------ */

const input =
  "rounded-lg border border-gray-300 bg-white px-2 py-1.5 outline-none focus:border-orange-400";


function SettingsView({
  settings,
  updateSettings,
  clearOrders,
}: {
  settings: Settings;
  updateSettings: (s: Settings) => void;
  clearOrders: () => void;
}) {
  const [newDrawing, setNewDrawing] = useState("");
  const [newSize, setNewSize] = useState({ name: "", label: "", price: "" });

  const setSize = (id: string, patch: Partial<Settings["sizes"][number]>) =>
    updateSettings({
      ...settings,
      sizes: settings.sizes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });


  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-bold">ข้อมูลร้าน</h3>
        <label className="block text-sm">
          ชื่อร้าน
          <input
            className={`${input} mt-1 w-full`}
            value={settings.shopName}
            onChange={(e) => updateSettings({ ...settings, shopName: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          เลขพร้อมเพย์ (เบอร์โทร / เลขบัตรประชาชน)
          <input
            className={`${input} mt-1 w-full`}
            value={settings.promptPayId}
            placeholder="เช่น 0812345678"
            onChange={(e) => updateSettings({ ...settings, promptPayId: e.target.value })}
          />
        </label>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-bold">ขนาดและราคา</h3>
        <div className="space-y-2">
          {settings.sizes.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <input
                className={`${input} w-14 text-center font-bold`}
                value={s.name}
                onChange={(e) => setSize(s.id, { name: e.target.value })}
              />
              <input
                className={`${input} min-w-0 flex-1`}
                value={s.label}
                onChange={(e) => setSize(s.id, { label: e.target.value })}
              />
              <span className="text-sm text-gray-500">฿</span>
              <input
                type="number"
                className={`${input} w-20 text-right`}
                value={s.price}
                onChange={(e) => setSize(s.id, { price: Number(e.target.value) || 0 })}
              />
              <Toggle on={s.active} onChange={(v) => setSize(s.id, { active: v })} />
              <button
                onClick={() =>
                  confirm(`ลบขนาด ${s.name}?`) &&
                  updateSettings({
                    ...settings,
                    sizes: settings.sizes.filter((x) => x.id !== s.id),
                  })
                }
                className="text-gray-400 hover:text-red-500"
                aria-label="ลบ"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          <input
            className={`${input} w-14`}
            placeholder="XXL"
            value={newSize.name}
            onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
          />
          <input
            className={`${input} min-w-0 flex-1`}
            placeholder="ชื่อเรียก"
            value={newSize.label}
            onChange={(e) => setNewSize({ ...newSize, label: e.target.value })}
          />
          <input
            type="number"
            className={`${input} w-20`}
            placeholder="ราคา"
            value={newSize.price}
            onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
          />
          <button
            disabled={!newSize.name || !newSize.price}
            onClick={() => {
              updateSettings({
                ...settings,
                sizes: [
                  ...settings.sizes,
                  {
                    id: uid(),
                    name: newSize.name,
                    label: newSize.label || newSize.name,
                    price: Number(newSize.price) || 0,
                    active: true,
                  },
                ],
              });
              setNewSize({ name: "", label: "", price: "" });
            }}
            className="rounded-lg bg-orange-500 px-3 py-1.5 font-semibold text-white disabled:bg-gray-300"
          >
            เพิ่ม
          </button>
        </div>
      </section>

      <OptionEditor
        title="รสชาติ (ผงเขย่า)"
        hint="ช่องตัวเลข = ราคาบวกเพิ่มจากราคาขนาด"
        items={settings.flavors}
        onChange={(flavors) => updateSettings({ ...settings, flavors })}
      />
      <OptionEditor
        title="ซอส (เลือกได้หลายอย่าง)"
        hint="ช่องตัวเลข = ราคาบวกเพิ่ม (0 = ฟรี)"
        items={settings.sauces}
        onChange={(sauces) => updateSettings({ ...settings, sauces })}
      />

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-bold">โปรโมชัน</h3>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>โปร 1: กดติดตาม → อัปไซซ์ฟรี (ขึ้นไปขนาดถัดไป จ่ายราคาเดิม)</span>
          <Toggle
            on={settings.upsizePromo}
            onChange={(v) => updateSettings({ ...settings, upsizePromo: v })}
          />
        </label>
        <label className="block text-sm">
          ไอจีชมรม (โปร 2: ลงสตอรี่แท็กไอจี)
          <input
            className={`${input} mt-1 w-full`}
            value={settings.igHandle}
            onChange={(e) => updateSettings({ ...settings, igHandle: e.target.value })}
          />
        </label>
        <div className="text-sm">
          <p className="mb-2">รูปวาดซอส (โปร 2)</p>
          <div className="flex flex-wrap gap-2">
            {settings.drawings.map((d) => (
              <span
                key={d}
                className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-purple-800"
              >
                {d}
                <button
                  aria-label={`ลบ ${d}`}
                  onClick={() =>
                    updateSettings({
                      ...settings,
                      drawings: settings.drawings.filter((x) => x !== d),
                    })
                  }
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className={`${input} min-w-0 flex-1`}
              placeholder="เพิ่มรูปใหม่ เช่น แมวน้ำ"
              value={newDrawing}
              onChange={(e) => setNewDrawing(e.target.value)}
            />
            <button
              disabled={!newDrawing.trim() || settings.drawings.includes(newDrawing.trim())}
              onClick={() => {
                updateSettings({
                  ...settings,
                  drawings: [...settings.drawings, newDrawing.trim()],
                });
                setNewDrawing("");
              }}
              className="rounded-lg bg-orange-500 px-3 py-1.5 font-semibold text-white disabled:bg-gray-300"
            >
              เพิ่ม
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-bold text-red-600">โซนอันตราย</h3>
        <button
          onClick={() =>
            confirm("คืนค่าเมนูและราคาเป็นค่าเริ่มต้น?") && updateSettings(DEFAULT_SETTINGS)
          }
          className="w-full rounded-xl border border-gray-300 py-2 text-sm"
        >
          คืนค่าเมนูเริ่มต้น
        </button>
        <button
          onClick={() =>
            confirm("ลบประวัติการขายทั้งหมด? (ควรดาวน์โหลด CSV เก็บไว้ก่อน)") &&
            clearOrders()
          }
          className="w-full rounded-xl border border-red-300 py-2 text-sm text-red-600"
        >
          ลบประวัติการขายทั้งหมด
        </button>
      </section>
    </div>
  );
}


function OptionEditor({
  title,
  hint,
  items,
  onChange,
}: {
  title: string;
  hint: string;
  items: Flavor[];
  onChange: (items: Flavor[]) => void;
}) {
  const [newFlavor, setNewFlavor] = useState({ name: "", emoji: "🍟", extra: "0" });
  const setFlavor = (id: string, patch: Partial<Flavor>) =>
    onChange(items.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  return (
  <section className="rounded-2xl bg-white p-4 shadow-sm">
    <h3 className="mb-1 font-bold">{title}</h3>
    <p className="mb-3 text-xs text-gray-500">{hint}</p>
    <div className="space-y-2">
      {items.map((f) => (
        <div key={f.id} className="flex items-center gap-2">
          <input
            className={`${input} w-12 text-center`}
            value={f.emoji}
            onChange={(e) => setFlavor(f.id, { emoji: e.target.value })}
          />
          <input
            className={`${input} min-w-0 flex-1`}
            value={f.name}
            onChange={(e) => setFlavor(f.id, { name: e.target.value })}
          />
          <span className="text-sm text-gray-500">+฿</span>
          <input
            type="number"
            className={`${input} w-16 text-right`}
            value={f.extra}
            onChange={(e) => setFlavor(f.id, { extra: Number(e.target.value) || 0 })}
          />
          <Toggle on={f.active} onChange={(v) => setFlavor(f.id, { active: v })} />
          <button
            onClick={() =>
              confirm(`ลบ ${f.name}?`) && onChange(items.filter((x) => x.id !== f.id))
            }
            className="text-gray-400 hover:text-red-500"
            aria-label="ลบ"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
    <div className="mt-3 flex items-center gap-2 border-t pt-3">
      <input
        className={`${input} w-12 text-center`}
        value={newFlavor.emoji}
        onChange={(e) => setNewFlavor({ ...newFlavor, emoji: e.target.value })}
      />
      <input
        className={`${input} min-w-0 flex-1`}
        placeholder="เพิ่มใหม่"
        value={newFlavor.name}
        onChange={(e) => setNewFlavor({ ...newFlavor, name: e.target.value })}
      />
      <input
        type="number"
        className={`${input} w-16`}
        value={newFlavor.extra}
        onChange={(e) => setNewFlavor({ ...newFlavor, extra: e.target.value })}
      />
      <button
        disabled={!newFlavor.name}
        onClick={() => {
          onChange([
              ...items,
              {
                id: uid(),
                name: newFlavor.name,
                emoji: newFlavor.emoji || "🍟",
                extra: Number(newFlavor.extra) || 0,
                active: true,
              },
            ]);
          setNewFlavor({ name: "", emoji: "🍟", extra: "0" });
        }}
        className="rounded-lg bg-orange-500 px-3 py-1.5 font-semibold text-white disabled:bg-gray-300"
      >
        เพิ่ม
      </button>
    </div>
  </section>
  );
}

/* ------------------------------ UI ย่อย ------------------------------ */

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        on ? "bg-green-500" : "bg-gray-300"
      }`}
      aria-label={on ? "ปิดการขาย" : "เปิดการขาย"}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          on ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="ปิด" className="text-gray-400">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
