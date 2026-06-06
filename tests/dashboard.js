import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';
import { generarReporteHTML } from '../reporte/generarReporte.js';

/*
curl -X 'GET' \
  'https://homebanking-demo.onrender.com/cliente/dashboard' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
*/

const BASE_URL = 'https://homebanking-demo.onrender.com';
const ENDPOINT = '/cliente/dashboard';

// Cargar tokens de usuarios logueados (generado por: node loginUsuarios.js)
const usersLogueados = new SharedArray('usersLogueados', function () {
    const data = JSON.parse(open('../data/usersLogueados.json'));
    return data;
});

function obtenerTokenRandom() {
    const index = Math.floor(Math.random() * usersLogueados.length);
    return usersLogueados[index].token;
}

// Escenario de prueba de carga
const scenarios = {
    load: {
        executor: 'constant-arrival-rate',
        rate: 5,
        timeUnit: '1s',
        duration: '30s',
        preAllocatedVUs: 5,
        maxVUs: 3000,
    }
};

const selectedScenario = __ENV.SCENARIO;

export const options = {
    scenarios: selectedScenario ? { [selectedScenario]: scenarios[selectedScenario] } : scenarios,
    thresholds: {
        http_req_duration: ['p(99)<3000'],
    },
};

export default function () {
    const token = obtenerTokenRandom();

    const res = http.get(`${BASE_URL}${ENDPOINT}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    check(res, {
        'status code 200': (r) => r.status === 200,
        'responde en menos de 3s': (r) => r.timings.duration < 3000,
    });
}

export function handleSummary(data) {
    const reporte = generarReporteHTML(data);
    return {
        [reporte.filePath]: reporte.html,
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, opts) {
    return JSON.stringify(data, null, 2);
}
