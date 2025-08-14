import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabaseClient";

/**
 * VelociGo — Guadalajara (MX)
 * App conectada a Supabase (restaurantes + menú)
 * y creación de órdenes reales vía /api/create-order
 * Servicios: Restaurantes y Mandados
 */

const MXN = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const RIDERS = [
  { id: "r1", name: "Ana G.", vehicle: "Moto", rating: 4.9 },
  { id: "r2", name: "Luis R.", vehicle: "Bici", rating: 4.8 },
  { id: "r3", name: "Paola T.", vehicle: "Moto", rating: 4.7 },
  { id: "r4", name: "Diego V.", vehicle: "Auto", rating: 4.6 },
];

function Header({ onHome, onGoCart, currentStep, cartCount, city }) {
  const logo = "/velocigo-logo.png";
  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onHome}
            className="flex items-center gap-2 text-xl font-black tracking-tight"
          >
            <img src={logo} alt="VelociGo" className="w-6 h-6 rounded" />
            ⚡ VelociGo · Guadalajara
          </button>
          <div className="hidden md:flex items-center text-xs text-gray-500 gap-2">
            <span
              className={`px-2 py-1 rounded-full ${
                currentStep === "home"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100"
              }`}
            >
              Explorar
            </span>
            <span
              className={`px-2 py-1 rounded-full ${
                currentStep === "restaurant"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100"
              }`}
            >
              Menú
            </span>
            <span
              className={`px-2 py-1 rounded-full ${
                currentStep === "checkout"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100"
              }`}
            >
              Checkout
            </span>
            <span
              className={`px-2 py-1 rounded-full ${
                currentStep === "track"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100"
              }`}
            >
              Rastrear
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-600 hidden sm:block">
          Entrega en <span className="font-medium">{city}</span>
        </div>
        <button
          onClick={onGoCart}
          className="relative rounded-2xl bg-gray-900 text-white px-3 py-2 text-sm shadow"
        >
          🛒 Carrito
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 text-[10px] bg-red-500 text-white rounded-full px-2 py-0.5 shadow">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function CategoryChips({ active, onSelect, items }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
      {items.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${
            active === c
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function Card({ item, onOpen }) {
  return (
    <motion.div
      layout
      className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition cursor-pointer"
      onClick={() => onOpen(item)}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="object-cover w-full h-full group-hover:scale-[1.02] transition"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            ★ {item.rating}
          </span>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
          <span>{item.category}</span>·
          <span>
            {item.eta_min}–{item.eta_max} min
          </span>
          ·<span>Entrega {MXN(item.fee)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function MenuItem({ item, onAdd }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3">
      <div>
        <div className="font-medium">{item.name}</div>
        <div className="text-sm text-gray-500 flex gap-2">
          <span>{MXN(item.price)}</span>
          {item.tags?.map((t) => (
            <span
              key={t}
              className="text-xs bg-gray-100 px-2 py-0.5 rounded-full"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => onAdd(item)}
        className="px-3 py-1.5 text-sm rounded-xl bg-gray-900 text-white"
      >
        Agregar
      </button>
    </div>
  );
}

function Cart({ items, onInc, onDec, onClear }) {
  const entries = Object.values(items);
  const subtotal = entries.reduce((s, it) => s + it.item.price * it.qty, 0);
  const delivery = entries.length ? 25 : 0;
  const service = Math.round(subtotal * 0.05);
  const total = subtotal + delivery + service;
  return (
    <div className="p-4 border border-gray-200 rounded-2xl sticky top-20">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Tu pedido</h4>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-red-600 underline"
          >
            Vaciar
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 mt-2">
          Agrega productos para verlos aquí.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {entries.map((row) => (
            <div
              key={row.item.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <div className="font-medium">{row.item.name}</div>
                <div className="text-gray-500">
                  {MXN(row.item.price)} × {row.qty}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDec(row.item)}
                  className="px-2 rounded bg-gray-100"
                >
                  −
                </button>
                <span className="w-6 text-center">{row.qty}</span>
                <button
                  onClick={() => onInc(row.item)}
                  className="px-2 rounded bg-gray-100"
                >
                  ＋
                </button>
              </div>
            </div>
          ))}
          <div className="h-px bg-gray-2  00" />
          <div className="text-sm flex justify-between">
            <span>Subtotal</span>
            <span>{MXN(subtotal)}</span>
          </div>
          <div className="text-sm flex justify-between">
            <span>Servicio (5%)</span>
            <span>{MXN(service)}</span>
          </div>
          <div className="text-sm flex justify-between">
            <span>Entrega</span>
            <span>{MXN(delivery)}</span>
          </div>
          <div className="text-base font-semibold flex justify-between">
            <span>Total</span>
            <span>{MXN(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutForm({ defaultAddress, onSubmit, total }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(
    defaultAddress || "Av. Juárez 123, Guadalajara, Jal."
  );
  const [details, setDetails] = useState("");
  const [method, setMethod] = useState("Efectivo");

  const canSubmit = name && phone && address;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name, phone, address, details, method });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-600">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200"
          placeholder="Tu nombre"
        />
      </div>
      <div>
        <label className="text-sm text-gray-600">Teléfono</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200"
          placeholder="33 0000 0000"
        />
      </div>
      <div>
        <label className="text-sm text-gray-600">Dirección de entrega</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200"
          placeholder="C. Colón 456, GDL"
        />
      </div>
      <div>
        <label className="text-sm text-gray-600">Indicaciones</label>
        <input
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200"
          placeholder="Apto, referencia, portería"
        />
      </div>
      <div>
        <label className="text-sm text-gray-600">Método de pago</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {["Efectivo", "Tarjeta", "Transferencia", "SPEI"].map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3 py-2 rounded-xl border ${
                method === m
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <button
        disabled={!canSubmit}
        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-2xl py-3 font-semibold shadow"
      >
        Confirmar pedido · {MXN(total)}
      </button>
    </form>
  );
}

function OrderTracker({ order, onBackHome }) {
  const steps = [
    { key: "placed", label: "Pedido realizado" },
    { key: "accepted", label: "Tienda aceptó" },
    { key: "preparing", label: "Preparando" },
    { key: "pickup", label: "Repartidor en camino" },
    { key: "delivered", label: "Entregado" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === order.status);
  const percent = (currentIndex / (steps.length - 1)) * 100;
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Rastrea tu pedido #{order.id}</h2>
        <p className="text-gray-600">ETA estimado: {order.eta} min</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="mb-4">
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-red-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-5 text-[11px] text-gray-600">
            {steps.map((s, i) => (
              <div
                key={s.key}
                className={`text-center ${
                  i <= currentIndex ? "text-gray-900" : ""
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="aspect-video rounded-xl bg-[linear-gradient(135deg,#fee2e2,#fecaca)] flex items-center justify-center text-sm text-gray-700">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Mapa simulado
                </div>
                <div className="mt-1">📍 {order.address}</div>
                <div className="mt-1">
                  🛵 {order.rider?.name} ({order.rider?.vehicle})
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-64">
            <div className="border border-gray-200 rounded-2xl p-4">
              <div className="font-semibold mb-2">Tu repartidor</div>
              <div className="text-sm">{order.rider?.name}</div>
              <div className="text-xs text-gray-500">
                Calif. {order.rider?.rating} · {order.rider?.vehicle}
              </div>
              <div className="h-px bg-gray-200 my-3" />
              <button
                onClick={onBackHome}
                className="w-full text-sm rounded-xl bg-gray-900 text-white py-2"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mandados({ onConfirm }) {
  const [what, setWhat] = useState("");
  const [from, setFrom] = useState("Parque Revolución, GDL");
  const [to, setTo] = useState("Av. Vallarta 6503, Zapopan");
  const [km, setKm] = useState(5);

  const base = 25;
  const perKm = 8;
  const service = 5;
  const subtotal = base + perKm * km;
  const total = subtotal + service;

  const confirm = () => {
    if (!what || !from || !to) return;
    onConfirm({ what, from, to, price: total });
  };

  return (
    <div className="rounded-3xl border border-gray-200 p-4">
      <div className="font-semibold mb-3">Mandados en Guadalajara</div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">¿Qué necesitas?</label>
          <input
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200"
            placeholder="Ej. recoger paquete, comprar flores, etc."
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Distancia estimada (km)</label>
          <input
            type="range"
            min={1}
            max={20}
            value={km}
            onChange={(e) => setKm(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-600">{km} km</div>
        </div>
        <div>
          <label className="text-sm text-gray-600">Origen</label>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Destino</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200"
          />
        </div>
      </div>
      <div className="h-px bg-gray-200 my-3" />
      <div className="text-sm flex flex-col gap-1">
        <div className="flex justify-between">
          <span>Tarifa base</span>
          <span>{MXN(base)}</span>
        </div>
        <div className="flex justify-between">
          <span>Costo por km</span>
          <span>
            {MXN(perKm)} × {km}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Servicio</span>
          <span>{MXN(service)}</span>
        </div>
        <div className="font-semibold flex justify-between text-base">
          <span>Total estimado</span>
          <span>{MXN(total)}</span>
        </div>
      </div>
      <button
        onClick={confirm}
        className="mt-3 w-full rounded-2xl bg-red-500 hover:bg-red-600 text-white py-3 font-semibold shadow"
      >
        Solicitar mandado · {MXN(total)}
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home"); // home | restaurant | checkout | track
  const [serviceType, setServiceType] = useState("comida"); // comida | mandados
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todo");
  const [sort, setSort] = useState("recomendado");
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState({});
  const [activeOrder, setActiveOrder] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const city = "Guadalajara, Jalisco";

  useEffect(() => {
    const load = async () => {
      try {
        const { data: rs, error } = await supabase
          .from("restaurants")
          .select("*")
          .order("rating", { ascending: false });
        if (error) throw error;

        const { data: menu, error: e2 } = await supabase
          .from("menu_items")
          .select("*");
        if (e2) throw e2;

        const merged = (rs || []).map((r) => ({
          ...r,
          menu: (menu || []).filter((m) => m.restaurant_id === r.id),
        }));
        setRestaurants(merged);
      } catch (err) {
        console.error("Supabase load error:", err?.message || err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("velocigo-cart");
    if (raw) setCart(JSON.parse(raw));
  }, []);
  useEffect(() => {
    localStorage.setItem("velocigo-cart", JSON.stringify(cart));
  }, [cart]);

  const categoryList = useMemo(() => {
    const cats = Array.from(
      new Set(restaurants.map((r) => r.category).filter(Boolean))
    );
    return ["Todo", ...(cats.length ? cats : ["Mexicana", "Hamburguesas", "Pizza"])];
  }, [restaurants]);

  const entries = Object.values(cart);
  const subtotal = entries.reduce((s, it) => s + it.item.price * it.qty, 0);
  const delivery = entries.length ? 25 : 0;
  const service = Math.round(subtotal * 0.05);
  const total = subtotal + delivery + service;

  const dataset = serviceType === "comida" ? restaurants : [];

  const filtered = useMemo(() => {
    if (serviceType === "mandados") return [];
    let list = [...dataset];
    if (category !== "Todo") list = list.filter((r) => r.category === category);
    if (search)
      list = list.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
      );
    switch (sort) {
      case "rapido":
        list.sort((a, b) => a.eta_min - b.eta_min);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "barato":
        list.sort((a, b) => a.fee - b.fee);
        break;
      default:
        list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [serviceType, dataset, category, search, sort]);

  const openStore = (r) => {
    setSelected(r);
    setView("restaurant");
  };

  const addItem = (item) => {
    if (!selected) return;
    const key = item.id;
    setCart((prev) => {
      const firstStore = Object.values(prev)[0]?.storeId;
      if (firstStore && firstStore !== selected.id) {
        alert(
          "Tu carrito pertenece a otro restaurante. Finaliza o vacíalo para cambiar."
        );
        return prev;
      }
      const row = prev[key];
      return {
        ...prev,
        [key]: row ? { ...row, qty: row.qty + 1 } : { item, qty: 1, storeId: selected.id },
      };
    });
  };

  const inc = (item) =>
    setCart((p) => ({ ...p, [item.id]: { ...p[item.id], qty: p[item.id].qty + 1 } }));
  const dec = (item) =>
    setCart((p) => {
      const row = p[item.id];
      if (!row) return p;
      const nextQty = row.qty - 1;
      const copy = { ...p };
      if (nextQty <= 0) delete copy[item.id];
      else copy[item.id] = { ...row, qty: nextQty };
      return copy;
    });
  const clearCart = () => setCart({});

  const goCheckout = () => setView("checkout");

  const placeOrder = async (payload) => {
    const items = Object.values(cart).map(({ item, qty }) => ({
      id: item.id,
      name: item.name,
      unit_price: item.price,
      qty,
    }));

    const body = {
      type: "comida",
      restaurant_id: selected?.id || null,
      address: payload.address,
      details: payload.details,
      payment_method: payload.method,
      total,
      items,
    };

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando la orden");

      const id = data.id;
      const rider = RIDERS[rand(0, RIDERS.length - 1)];
      const eta = rand(15, 35);
      setActiveOrder({
        id,
        status: "placed",
        eta,
        rider,
        address: payload.address,
      });
      setView("track");
      clearCart();
    } catch (e) {
      alert(e.message || "No se pudo crear la orden");
      console.error(e);
    }
  };

  const confirmMandado = async ({ what, from, to, price }) => {
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "mandado",
          restaurant_id: null,
          address: to,
          details: `Recoge: ${from} · ${what}`,
          payment_method: "Efectivo",
          total: price,
          items: [],
          mandado: { what, from, to, price },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando el mandado");

      const rider = RIDERS[rand(0, RIDERS.length - 1)];
      setActiveOrder({
        id: data.id,
        status: "placed",
        eta: 15,
        rider,
        address: to,
      });
      setView("track");
    } catch (e) {
      alert(e.message || "No se pudo crear el mandado");
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-red-50">
      <Header
        onHome={() => setView("home")}
        onGoCart={() => (view === "checkout" ? null : setView("checkout"))}
        currentStep={view}
        cartCount={Object.values(cart).reduce((s, it) => s + it.qty, 0)}
        city={city}
      />

      {view === "home" && (
        <div className="max-w-6xl mx-auto p-4">
          <div className="rounded-3xl bg-red-100 border border-red-200 p-4 md:p-6 mb-5">
            <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-6">
              <div className="flex-1">
                <div className="text-2xl md:text-3xl font-black leading-tight">
                  VelociGo en Guadalajara
                </div>
                <div className="text-gray-600">
                  Elige tu servicio: comida o mandados.
                </div>
              </div>
              <div className="flex-1">
                {serviceType !== "mandados" && (
                  <>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar restaurante o plato"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200"
                    />
                    <div className="mt-2 flex gap-2 text-xs">
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200"
                      >
                        <option value="recomendado">Recomendado</option>
                        <option value="rapido">Más rápido</option>
                        <option value="rating">Mejor calificado</option>
                        <option value="barato">Entrega más barata</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {[
                { key: "comida", label: "Restaurantes" },
                { key: "mandados", label: "Mandados" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setServiceType(t.key);
                    setSelected(null);
                    setCart({});
                  }}
                  className={`px-3 py-2 rounded-2xl text-sm border ${
                    serviceType === t.key
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {serviceType !== "mandados" && (
              <div className="mt-3">
                <CategoryChips
                  active={category}
                  onSelect={setCategory}
                  items={categoryList}
                />
              </div>
            )}
          </div>

          {serviceType === "mandados" ? (
            <Mandados onConfirm={confirmMandado} />
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filtered.map((r) => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card item={r} onOpen={openStore} />
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-sm text-gray-500">
                    {restaurants.length
                      ? "No hay resultados con esos filtros."
                      : "Cargando restaurantes..."}
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {view === "restaurant" && selected && serviceType !== "mandados" && (
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="rounded-3xl overflow-hidden border border-gray-200">
              <img
                src={selected.image}
                alt={selected.name}
                className="w-full aspect-[16/6] object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selected.name}</h2>
                    <div className="text-sm text-gray-600">
                      {selected.category} · {selected.eta_min}–{selected.eta_max} min · Entrega{" "}
                      {MXN(selected.fee)}
                    </div>
                  </div>
                  <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ★ {selected.rating}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-gray-200 p-4">
              <div className="font-semibold mb-2">Menú</div>
              {selected.menu?.map((m) => (
                <MenuItem key={m.id} item={m} onAdd={addItem} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Cart items={cart} onInc={inc} onDec={dec} onClear={clearCart} />
            <button
              onClick={goCheckout}
              disabled={Object.values(cart).length === 0}
              className="mt-3 w-full rounded-2xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-3 font-semibold shadow"
            >
              Ir al checkout · {MXN(total)}
            </button>
          </div>
        </div>
      )}

      {view === "checkout" && serviceType !== "mandados" && (
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-gray-200 p-4">
              <div className="font-semibold mb-3">Datos de entrega</div>
              <CheckoutForm
                defaultAddress={"Av. Juárez 123, Guadalajara, Jal."}
                onSubmit={placeOrder}
                total={total}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <Cart items={cart} onInc={inc} onDec={dec} onClear={clearCart} />
          </div>
        </div>
      )}

      {view === "track" && activeOrder && (
        <OrderTracker order={activeOrder} onBackHome={() => setView("home")} />
      )}

      <footer className="max-w-6xl mx-auto px-4 py-10 text-xs text-gray-500">
        VelociGo · Guadalajara · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
