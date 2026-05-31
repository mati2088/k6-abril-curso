import http from 'k6/http';
import { sleep, check } from 'k6';

// 1. Opciones: Configuran el escenario de la prueba
export const options = {
  vus: 1,           // 10 Usuarios Virtuales (VUs) simultáneos
  duration: '30s',   // Durante 30 segundos
};

// 2. Función Default: Lo que hace cada usuario virtual
export default function () {
  const res = http.get('https://test.k6.io');
  
  // Verificamos que la respuesta sea 200 (como un assertion)
  check(res, { 'status es 200': (r) => r.status === 200 });
  
 }
