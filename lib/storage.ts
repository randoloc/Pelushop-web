import { supabase } from "@/lib/supabase";

export async function subirImagen(
  negocioId: string,
  archivo: File,
): Promise<string | null> {
  const extension = archivo.name.split(".").pop();
  const ruta = `${negocioId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("negocios-media")
    .upload(ruta, archivo);

  if (error) return null;

  const { data } = supabase.storage
    .from("negocios-media")
    .getPublicUrl(ruta);

  return data.publicUrl;
}
