'use strict';

/* ==========================================================
   Buscador de episodios de Rick and Morty
   ========================================================== */

const URL_API_EPISODIOS = 'https://rickandmortyapi.com/api/episode';
const CLAVE_ULTIMA_BUSQUEDA = 'rm-ultima-busqueda';
const TEXTO_DESCONOCIDO = 'Desconocido';

const formulario = document.querySelector('#formulario-busqueda');
const campoNombre = document.querySelector('#nombre');
const campoTemporada = document.querySelector('#temporada');
const botonBuscar = document.querySelector('#boton-buscar');
const zonaEstado = document.querySelector('#estado');
const zonaResultados = document.querySelector('#resultados');

/* ---------- Utilidades de datos ---------- */

// Devuelve el valor como texto, o «Desconocido» si viene vacío o como "unknown".
const valorOLeyenda = (valor) => {
  const texto = String(valor ?? '').trim();
  const esDesconocido = texto === '' || texto.toLowerCase() === 'unknown';
  return esDesconocido ? TEXTO_DESCONOCIDO : texto;
};

const leerCriterios = () => ({
  nombre: campoNombre.value.trim(),
  temporada: campoTemporada.value,
});

const hayCriterios = ({ nombre, temporada }) => nombre !== '' || temporada !== '';

/* ---------- Petición a la API ---------- */

const pedirEpisodios = async ({ nombre, temporada }) => {
  const url = new URL(URL_API_EPISODIOS);
  if (nombre) url.searchParams.set('name', nombre);
  if (temporada) url.searchParams.set('episode', temporada);

  const respuesta = await fetch(url);

  // La API responde 404 cuando no hay coincidencias: no es un error, es «sin resultados».
  if (respuesta.status === 404) return { info: { count: 0 }, results: [] };
  if (!respuesta.ok) throw new Error(`La API respondió con el código ${respuesta.status}`);

  const datos = await respuesta.json();
  return datos;
};

/* ---------- Pantalla ---------- */

const mostrarMensaje = (texto, tipo = 'info') => {
  zonaEstado.textContent = texto;
  zonaEstado.className = `estado estado--${tipo}`;
};

const limpiarResultados = () => zonaResultados.replaceChildren();

const crearDato = (etiqueta, valor) => {
  const fila = document.createElement('div');
  fila.className = 'tarjeta__dato';

  const termino = document.createElement('dt');
  termino.textContent = etiqueta;

  const descripcion = document.createElement('dd');
  descripcion.textContent = valorOLeyenda(valor);

  fila.append(termino, descripcion);
  return fila;
};

const crearTarjeta = (episodio) => {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';

  const codigo = document.createElement('span');
  codigo.className = 'tarjeta__codigo';
  codigo.textContent = valorOLeyenda(episodio.episode);

  const titulo = document.createElement('h3');
  titulo.className = 'tarjeta__titulo';
  titulo.textContent = valorOLeyenda(episodio.name);

  const cantidadPersonajes = Array.isArray(episodio.characters) ? episodio.characters.length : '';
  const datos = document.createElement('dl');
  datos.className = 'tarjeta__datos';
  datos.append(
    crearDato('Emisión', episodio.air_date),
    crearDato('Personajes', cantidadPersonajes),
  );

  tarjeta.append(codigo, titulo, datos);
  return tarjeta;
};

const mostrarTarjetas = (episodios) => {
  zonaResultados.replaceChildren(...episodios.map(crearTarjeta));
};

const describirResultados = (total, mostrados) => {
  if (total > mostrados) return `Mostrando los primeros ${mostrados} de ${total} episodios.`;
  return total === 1 ? 'Se encontró 1 episodio.' : `Se encontraron ${total} episodios.`;
};

/* ---------- Persistencia (localStorage) ---------- */

const guardarBusqueda = (criterios) => {
  try {
    localStorage.setItem(CLAVE_ULTIMA_BUSQUEDA, JSON.stringify(criterios));
  } catch {
    // Si el navegador no permite guardar, la búsqueda funciona igual.
  }
};

const leerBusquedaGuardada = () => {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE_ULTIMA_BUSQUEDA));
    if (!guardada) return null;
    return {
      nombre: String(guardada.nombre ?? ''),
      temporada: String(guardada.temporada ?? ''),
    };
  } catch {
    return null;
  }
};

/* ---------- Flujo principal ---------- */

const buscar = async (criterios) => {
  botonBuscar.disabled = true;
  limpiarResultados();
  mostrarMensaje('Buscando…', 'cargando');

  try {
    const { info, results } = await pedirEpisodios(criterios);

    if (results.length === 0) {
      mostrarMensaje('Sin resultados. Prueba con otro nombre u otra temporada.', 'vacio');
      return;
    }

    mostrarTarjetas(results);
    mostrarMensaje(describirResultados(info?.count ?? results.length, results.length));
  } catch {
    mostrarMensaje('No se pudo completar la búsqueda. Revisa tu conexión e inténtalo de nuevo.', 'error');
  } finally {
    botonBuscar.disabled = false;
  }
};

const manejarEnvio = (evento) => {
  evento.preventDefault();
  const criterios = leerCriterios();

  if (!hayCriterios(criterios)) {
    limpiarResultados();
    mostrarMensaje('Escribe un nombre o elige una temporada para poder buscar.', 'aviso');
    campoNombre.focus();
    return;
  }

  guardarBusqueda(criterios);
  buscar(criterios);
};

const restaurarUltimaBusqueda = () => {
  const guardada = leerBusquedaGuardada();
  if (!guardada) return;

  campoNombre.value = guardada.nombre;
  campoTemporada.value = guardada.temporada;

  const criterios = leerCriterios();
  if (hayCriterios(criterios)) buscar(criterios);
};

formulario.addEventListener('submit', manejarEnvio);
restaurarUltimaBusqueda();
