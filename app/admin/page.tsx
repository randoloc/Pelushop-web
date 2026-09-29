"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { subirImagen } from "@/lib/storage";

type Negocio = { id: string; nombre: string; slug: string };
type Cita = {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  fecha: string;
  hora: string;
  estado: string;
  total: number;
};
type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  categoria_id: string | null;
  imagenes: string[];
};
type Categoria = { id: string; nombre: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [tab, setTab] = useState<"citas" | "servicios">("citas");

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/admin/login");
      return;
    }

    const { data: adminRow } = await supabase
      .from("admins_negocio")
      .select("negocio_id, negocios ( id, nombre, slug )")
      .eq("user_id", userData.user.id)
      .single();

    if (!adminRow?.negocios) {
      setCargando(false);
      return;
    }

    const negocioData = adminRow.negocios as unknown as Negocio;
    setNegocio(negocioData);

    const [{ data: citasData }, { data: serviciosData }, { data: categoriasData }] =
      await Promise.all([
        supabase
          .from("citas")
          .select("id, cliente_nombre, cliente_telefono, fecha, hora, estado, total")
          .eq("negocio_id", negocioData.id)
          .order("fecha", { ascending: true }),
        supabase
          .from("servicios")
          .select("id, nombre, precio, duracion_minutos, categoria_id, imagenes")
          .eq("negocio_id", negocioData.id),
        supabase
          .from("categorias_servicio")
          .select("id, nombre")
          .eq("negocio_id", negocioData.id)
          .order("orden"),
      ]);

    setCitas(citasData ?? []);
    setServicios(serviciosData ?? []);
    setCategorias(categoriasData ?? []);
    setCargando(false);
  }

  async function actualizarEstado(citaId: string, estado: string) {
    await supabase.from("citas").update({ estado }).eq("id", citaId);
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado } : c)),
    );
  }

  async function agregarServicio(form: FormData) {
    if (!negocio) return;
    const nombre = form.get("nombre") as string;
    const precio = Number(form.get("precio"));
    const duracion = Number(form.get("duracion"));
    const categoria_id = (form.get("categoria_id") as string) || null;
    const foto = form.get("foto") as File | null;

    let imagenes: string[] = [];
    if (foto && foto.size > 0) {
      const url = await subirImagen(negocio.id, foto);
      if (url) imagenes = [url];
    }

    const { data, error } = await supabase
      .from("servicios")
      .insert({
        negocio_id: negocio.id,
        nombre,
        precio,
        duracion_minutos: duracion,
        categoria_id,
        imagenes,
      })
      .select()
      .single();

    if (!error && data) {
      setServicios((prev) => [...prev, data]);
    }
  }

  async function guardarEdicion(servicioId: string, form: FormData) {
    const nombre = form.get("nombre") as string;
    const precio = Number(form.get("precio"));
    const duracion = Number(form.get("duracion"));
    const categoria_id = (form.get("categoria_id") as string) || null;

    const { data, error } = await supabase
      .from("servicios")
      .update({ nombre, precio, duracion_minutos: duracion, categoria_id })
      .eq("id", servicioId)
      .select()
      .single();

    if (!error && data) {
      setServicios((prev) => prev.map((s) => (s.id === servicioId ? data : s)));
      setEditando(null);
    }
  }

  async function eliminarServicio(servicioId: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    const { error } = await supabase
      .from("servicios")
      .delete()
      .eq("id", servicioId);
    if (!error) {
      setServicios((prev) => prev.filter((s) => s.id !== servicioId));
    }
  }

  async function crearCategoria(form: FormData) {
    if (!negocio) return;
    const nombre = form.get("categoria_nueva") as string;
    if (!nombre) return;

    const { data, error } = await supabase
      .from("categorias_servicio")
      .insert({ negocio_id: negocio.id, nombre, orden: categorias.length })
      .select()
      .single();

    if (!error && data) {
      setCategorias((prev) => [...prev, data]);
    }
  }

  if (cargando) {
    return <p className="mx-auto max-w-4xl px-6 py-16 text-muted">Cargando...</p>;
  }

  if (!negocio) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-muted">
        Tu cuenta todavía no está asociada a ningún negocio.{" "}
        <a href="/registro-negocio" className="text-gold">
          Crear una tienda
        </a>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold">{negocio.nombre}</h1>
      <p className="text-sm text-muted">
        <a href={`/tienda/${negocio.slug}`} className="text-gold">
          Ver mi página pública →
        </a>
      </p>

      <div className="mt-8 flex gap-2">
        <TabButton activo={tab === "citas"} onClick={() => setTab("citas")}>
          Citas ({citas.length})
        </TabButton>
        <TabButton
          activo={tab === "servicios"}
          onClick={() => setTab("servicios")}
        >
          Servicios ({servicios.length})
        </TabButton>
      </div>

      {tab === "citas" ? (
        <ul className="mt-6 divide-y divide-surfaceBorder rounded-2xl border border-surfaceBorder bg-surface">
          {citas.length === 0 && (
            <li className="p-6 text-center text-muted">
              Todavía no tienes citas agendadas.
            </li>
          )}
          {citas.map((cita) => (
            <li key={cita.id} className="flex items-center justify-between p-5">
              <div>
                <p className="font-medium">{cita.cliente_nombre}</p>
                <p className="text-xs text-muted">
                  {cita.fecha} · {cita.hora} · ${cita.total}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EstadoBadge estado={cita.estado} />
                {cita.estado === "pendiente" && (
                  <>
                    <button
                      onClick={() => actualizarEstado(cita.id, "confirmada")}
                      className="rounded-full bg-gold-gradient px-3 py-1.5 text-xs font-bold text-base"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => actualizarEstado(cita.id, "cancelada")}
                      className="rounded-full border border-danger/50 px-3 py-1.5 text-xs text-danger"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 space-y-6">
          <ul className="divide-y divide-surfaceBorder rounded-2xl border border-surfaceBorder bg-surface">
            {servicios.map((s) =>
              editando === s.id ? (
                <li key={s.id} className="p-4">
                  <form
                    action={(form) => guardarEdicion(s.id, form)}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      name="nombre"
                      defaultValue={s.nombre}
                      className="flex-1 rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
                    />
                    <input
                      name="precio"
                      type="number"
                      defaultValue={s.precio}
                      className="w-24 rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
                    />
                    <input
                      name="duracion"
                      type="number"
                      defaultValue={s.duracion_minutos}
                      className="w-24 rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
                    />
                    <select
                      name="categoria_id"
                      defaultValue={s.categoria_id ?? ""}
                      className="rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
                    >
                      <option value="">Sin categoría</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold text-base">
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditando(null)}
                      className="text-xs text-muted"
                    >
                      Cancelar
                    </button>
                  </form>
                </li>
              ) : (
                <li key={s.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {s.imagenes?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.imagenes[0]}
                        alt={s.nombre}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p>{s.nombre}</p>
                      <p className="text-xs text-muted">
                        {categorias.find((c) => c.id === s.categoria_id)
                          ?.nombre ?? "Sin categoría"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gold">${s.precio}</span>
                    <button
                      onClick={() => setEditando(s.id)}
                      className="text-xs text-muted hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarServicio(s.id)}
                      className="text-xs text-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>

          <form
            action={agregarServicio}
            className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-surfaceBorder p-4"
          >
            <input
              name="nombre"
              placeholder="Nombre del servicio"
              required
              className="flex-1 rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
            />
            <input
              name="precio"
              type="number"
              placeholder="Precio"
              required
              className="w-24 rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
            />
            <input
              name="duracion"
              type="number"
              placeholder="Minutos"
              required
              className="w-24 rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
            />
            <select
              name="categoria_id"
              className="rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              name="foto"
              type="file"
              accept="image/*"
              className="text-xs text-muted file:mr-2 file:rounded-full file:border-0 file:bg-gold-gradient file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-base"
            />
            <button className="rounded-full bg-gold-gradient px-5 py-2 text-sm font-bold text-base">
              Agregar
            </button>
          </form>

          <form
            action={crearCategoria}
            className="flex gap-3 rounded-2xl border border-surfaceBorder bg-surface p-4"
          >
            <input
              name="categoria_nueva"
              placeholder="Nueva categoría (ej: Color, Barbería)"
              className="flex-1 rounded-lg border border-surfaceBorder bg-base px-3 py-2 text-sm"
            />
            <button className="rounded-full border border-gold/50 px-4 py-2 text-sm text-gold">
              + Categoría
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function TabButton({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm ${
        activo ? "bg-gold-gradient font-bold text-base" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colores: Record<string, string> = {
    pendiente: "text-gold border-gold/40",
    confirmada: "text-success border-success/40",
    cancelada: "text-danger border-danger/40",
    completada: "text-muted border-surfaceBorder",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${colores[estado] ?? ""}`}
    >
      {estado}
    </span>
  );
}
