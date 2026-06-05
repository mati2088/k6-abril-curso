import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate } from 'k6/metrics';
import { generarReporteHTML } from './reporte/generarReporte.js';

/*
curl -X 'POST' \
  'https://homebanking-demo.onrender.com/auth/registro' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "juan@email.com",
  "name": "Juan Pérez",
  "password": "mipassword123",
  "username": "juanperez"
}'
*/

const BASE_URL = 'https://homebanking-demo.onrender.com'
const ENDPOINT = '/auth/registro'

function generarPayload() {
    const id = `${__VU}_${__ITER}_${Date.now()}`;
    return JSON.stringify({
        email: `user_${id}@gmail.com`,
        name: `Usuario ${id}`,
        password: 'rodo123',
        username: `user_${id}`
    });
}

const HEADERS = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
}

//escenario de prueba de carga
const scenarios = {
    load: {
        executor: 'constant-arrival-rate',
        rate: 5000,
        timeUnit: '1s',
        duration: '30s',
        preAllocatedVUs: 5,
        maxVUs: 3000
    }
};

const selectedScenario = __ENV.SCENARIO;

export const options = {
    scenarios: selectedScenario ? { [selectedScenario]: scenarios[selectedScenario] } : scenarios
}



export default function () {
    const payload = generarPayload();
    const res = http.post(`${BASE_URL}${ENDPOINT}`, payload, HEADERS);

    check(res, {
        'status code 200': (r) => r.status === 200,
        'responde en menos de 3s': (r) => r.timings.duration < 3000,
    })
    console.log(res.body)
}

export function handleSummary(data) {
    const reporte = generarReporteHTML(data);
    return {
        [reporte.filePath]: reporte.html,
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, opts) {
    // k6 built-in text summary fallback
    return JSON.stringify(data, null, 2);
}