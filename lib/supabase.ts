import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Negocio = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  logo_url: string | null;
  direccion: string | null;
  activo: boolean;
};

export type Servicio = {
  id: string;
  negocio_id: string;
  categoria_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_minutos: number;
  imagenes: string[];
};

export async function getNegocios(): Promise<Negocio[]> {
  const { data, error } = await supabase
    .from("negocios")
    .select("*")
    .eq("activo", true);
  if (error || !data) return [];
  return data as Negocio[];
}

export async function getNegocioPorSlug(slug: string): Promise<Negocio | null> {
  const { data, error } = await supabase
    .from("negocios")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data as Negocio;
}

export type Categoria = {
  id: string;
  negocio_id: string;
  nombre: string;
  orden: number;
};

export async function getCategoriasDeNegocio(
  negocioId: string,
): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias_servicio")
    .select("*")
    .eq("negocio_id", negocioId)
    .order("orden");
  if (error || !data) return [];
  return data as Categoria[];
}

export async function getServiciosDeNegocio(negocioId: string): Promise<Servicio[]> {
  const { data, error } = await supabase
    .from("servicios")
    .select("*")
    .eq("negocio_id", negocioId)
    .eq("activo", true);
  if (error || !data) return [];
  return data as Servicio[];
}
