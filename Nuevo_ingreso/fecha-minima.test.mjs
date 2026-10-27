import test from 'node:test';
import assert from 'node:assert/strict';
import {limiteNacimientoEstudiante,errorNacimientoEstudiante} from './validaciones.mjs';
test('nacimiento: siete años cumplidos, fechas escritas, futuras y años bisiestos',()=>{
 const hoy=new Date(2026,9,26);
 assert.equal(limiteNacimientoEstudiante(hoy),'2019-10-26');
 assert.equal(errorNacimientoEstudiante('2019-10-26',hoy),'');
 assert.notEqual(errorNacimientoEstudiante('2019-10-27',hoy),'');
 assert.equal(errorNacimientoEstudiante('2009-12-21',hoy),'');
 assert.notEqual(errorNacimientoEstudiante('2027-01-01',hoy),'');
 assert.notEqual(errorNacimientoEstudiante('2019-02-29',hoy),'');
 assert.equal(limiteNacimientoEstudiante(new Date(2024,1,29)),'2017-02-28');
});
