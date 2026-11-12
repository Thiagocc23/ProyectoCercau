
/**
 * CERCau - Rol 4
 * Comunicación con la API real de reseñas.
 *
 * No administra la autenticación.
 * Las operaciones protegidas reciben el token
 * de sesión como parámetro.
 */

export interface ResenaApi {
    id: string;
    comercioId: string;
    usuarioId: string;
    estrellas: number;
    comentario: string;
    respuesta: string | null;
    reportada: boolean;
    creadaEn: string;
    sincronizada: boolean;
  }
  
  interface MetaApi {
    total: number;
    pagina: number;
    porPagina: number;
  }
  
  interface RespuestaListaApi<T> {
    datos: T[];
    meta: MetaApi;
  }
  
  interface RespuestaUnoApi<T> {
    datos: T;
    meta: null;
  }
  
  interface OpcionesPeticion {
    metodo?: "GET" | "POST" | "PATCH" | "DELETE";
    token?: string;
    cuerpo?: unknown;
  }
  
  export class ErrorApiResenas extends Error {
    constructor(
      mensaje: string,
      public readonly estado: number,
      public readonly codigo: string
    ) {
      super(mensaje);
      this.name = "ErrorApiResenas";
    }
  }
  
  function obtenerUrlBase(): string {
    const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  
    if (!url) {
      throw new Error(
        "Falta configurar EXPO_PUBLIC_API_URL en el archivo .env."
      );
    }
  
    return url.replace(/\/+$/, "");
  }
  
  async function solicitarApi<T>(
    ruta: string,
    opciones: OpcionesPeticion = {}
  ): Promise<T> {
    const { metodo = "GET", token, cuerpo } = opciones;
  
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
  
    if (cuerpo !== undefined) {
      headers["Content-Type"] = "application/json";
    }
  
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  
    const respuesta = await fetch(
      `${obtenerUrlBase()}${ruta}`,
      {
        method: metodo,
        headers,
        body:
          cuerpo === undefined
            ? undefined
            : JSON.stringify(cuerpo),
      }
    );
  
    // DELETE devuelve 204 y no tiene cuerpo.
    if (respuesta.status === 204) {
      return undefined as T;
    }
  
    const texto = await respuesta.text();
    let contenido: unknown = null;
  
    if (texto) {
      try {
        contenido = JSON.parse(texto);
      } catch {
        throw new Error(
          "El servidor devolvió una respuesta que no es JSON válido."
        );
      }
    }
  
    if (!respuesta.ok) {
      const errorRespuesta = contenido as {
        error?: {
          codigo?: string;
          mensaje?: string;
        };
      } | null;
  
      throw new ErrorApiResenas(
        errorRespuesta?.error?.mensaje ??
          `Error de la API (${respuesta.status}).`,
        respuesta.status,
        errorRespuesta?.error?.codigo ?? "ERROR_HTTP"
      );
    }
  
 
    if (
        contenido === null ||
        typeof contenido !== 'object'
      ) {
        throw new Error(
          'La API no devolvió los datos esperados.'
        );
      }
      
      // Comprobamos si la API devolvió un error
      // incluso cuando el código HTTP sea 200.
      if ('error' in contenido && contenido.error) {
        const errorApi = contenido.error as {
          codigo?: string;
          mensaje?: string;
        };
      
        throw new ErrorApiResenas(
          errorApi.mensaje ?? 'La operación no pudo completarse.',
          respuesta.status,
          errorApi.codigo ?? 'ERROR_API'
        );
      }
      
      // Las respuestas exitosas deben contener datos.
      if (!('datos' in contenido)) {
        throw new Error(
          'La respuesta de la API no contiene datos.'
        );
      }
      
      return contenido as T; 
    }





  
  // ------------------------------------------
  // 1. CONSULTAR RESEÑAS
  // GET /comercios/:id/resenas
  // ------------------------------------------
  
  export async function listarResenasApi(
    comercioId: string
  ): Promise<ResenaApi[]> {
    const todas: ResenaApi[] = [];
    let pagina = 1;
  
    while (true) {
      const ruta =
        `/comercios/${encodeURIComponent(comercioId)}/resenas` +
        `?pagina=${pagina}&porPagina=100`;
  
      const respuesta = await solicitarApi<
        RespuestaListaApi<ResenaApi>
      >(ruta);
  
      todas.push(...respuesta.datos);
  
      if (
        todas.length >= respuesta.meta.total ||
        respuesta.datos.length === 0
      ) {
        break;
      }
  
      pagina++;
    }
  
    return todas;
  }
  
  // ------------------------------------------
  // 2. CREAR RESEÑA
  // POST /comercios/:id/resenas
  // Requiere token de vecino.
  // ------------------------------------------
  
  export interface CrearResenaApi {
    id?: string;
    estrellas: number;
    comentario: string;
    creadaEn?: string;
  }
  
  export async function crearResenaApi(
    comercioId: string,
    datos: CrearResenaApi,
    token: string
  ): Promise<ResenaApi> {
    const respuesta = await solicitarApi<
      RespuestaUnoApi<ResenaApi>
    >(
      `/comercios/${encodeURIComponent(comercioId)}/resenas`,
      {
        metodo: "POST",
        token,
        cuerpo: datos,
      }
    );
  
    return respuesta.datos;
  }
  
  // ------------------------------------------
  // 3. EDITAR RESEÑA
  // PATCH /resenas/:id
  // Requiere token del autor.
  // ------------------------------------------
  
  export interface EditarResenaApi {
    estrellas?: number;
    comentario?: string;
  }
  
  export async function editarResenaApi(
    id: string,
    cambios: EditarResenaApi,
    token: string
  ): Promise<ResenaApi> {
    const respuesta = await solicitarApi<
      RespuestaUnoApi<ResenaApi>
    >(
      `/resenas/${encodeURIComponent(id)}`,
      {
        metodo: "PATCH",
        token,
        cuerpo: cambios,
      }
    );
  
    return respuesta.datos;
  }
  
  // ------------------------------------------
  // 4. ELIMINAR RESEÑA
  // DELETE /resenas/:id
  // Requiere token del autor.
  // ------------------------------------------
  
  export async function eliminarResenaApi(
    id: string,
    token: string
  ): Promise<void> {
    await solicitarApi<void>(
      `/resenas/${encodeURIComponent(id)}`,
      {
        metodo: "DELETE",
        token,
      }
    );
  }
  
  // ------------------------------------------
  // 5. REPORTAR RESEÑA
  // POST /resenas/:id/reportes
  // Requiere sesión. No admite reportes propios.
  // ------------------------------------------
  
  export async function reportarResenaApi(
    id: string,
    token: string
  ): Promise<ResenaApi> {
    const respuesta = await solicitarApi<
      RespuestaUnoApi<ResenaApi>
    >(
      `/resenas/${encodeURIComponent(id)}/reportes`,
      {
        metodo: "POST",
        token,
      }
    );
  
    return respuesta.datos;
  }
  
  // ------------------------------------------
  // 6. RESPONDER COMO COMERCIO
  // POST /resenas/:id/respuesta
  // Requiere token del comercio correspondiente.
  // ------------------------------------------
  
  export async function responderResenaApi(
    id: string,
    texto: string,
    token: string
  ): Promise<ResenaApi> {
    const respuesta = await solicitarApi<
      RespuestaUnoApi<ResenaApi>
    >(
      `/resenas/${encodeURIComponent(id)}/respuesta`,
      {
        metodo: "POST",
        token,
        cuerpo: {
          respuesta: texto.trim(),
        },
      }
    );
  
    return respuesta.datos;
  }
  