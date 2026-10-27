import { mostrarFichaOficial } from "../ficha-oficial.js";
export function mostrarFichaConsulta(contenedor, datos) {
  mostrarFichaOficial(contenedor, datos);
  const logo = contenedor.querySelector('.fo-logo');
  if (logo) logo.src = new URL('./img/Escudo-inco.png', import.meta.url).href;
}
