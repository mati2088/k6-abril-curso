export function generarReporteHTML(data) {
    const fecha = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `reporte/reporte_${fecha}.html`;

    const metrics = data.metrics;

    // Extraer métricas principales
    const httpReqDuration = metrics.http_req_duration ? metrics.http_req_duration.values : {};
    const httpReqs = metrics.http_reqs ? metrics.http_reqs.values : {};
    const iterations = metrics.iterations ? metrics.iterations.values : {};
    const checks = metrics.checks ? metrics.checks.values : {};
    const httpReqFailed = metrics.http_req_failed ? metrics.http_req_failed.values : {};
    const httpReqWaiting = metrics.http_req_waiting ? metrics.http_req_waiting.values : {};
    const httpReqConnecting = metrics.http_req_connecting ? metrics.http_req_connecting.values : {};
    const httpReqSending = metrics.http_req_sending ? metrics.http_req_sending.values : {};
    const httpReqReceiving = metrics.http_req_receiving ? metrics.http_req_receiving.values : {};
    const httpReqBlocked = metrics.http_req_blocked ? metrics.http_req_blocked.values : {};
    const httpReqTlsHandshaking = metrics.http_req_tls_handshaking ? metrics.http_req_tls_handshaking.values : {};
    const vus = metrics.vus ? metrics.vus.values : {};
    const vusMax = metrics.vus_max ? metrics.vus_max.values : {};
    const dataReceived = metrics.data_received ? metrics.data_received.values : {};
    const dataSent = metrics.data_sent ? metrics.data_sent.values : {};
    const iterationDuration = metrics.iteration_duration ? metrics.iteration_duration.values : {};

    // Calcular valores JMeter
    const samples = httpReqs.count || 0;
    const errorRate = httpReqFailed.rate || 0;
    const errorCount = Math.round(samples * errorRate);
    const throughput = httpReqs.rate || 0;
    const receivedKBs = (dataReceived.rate || 0) / 1024;
    const sentKBs = (dataSent.rate || 0) / 1024;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 Report - JMeter Summary - ${fecha}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #333;
            padding: 20px;
        }
        .header {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 20px 30px;
            margin-bottom: 20px;
            border-left: 4px solid #d32f2f;
        }
        .header h1 {
            font-size: 24px;
            color: #333;
            margin-bottom: 4px;
        }
        .header .subtitle {
            font-size: 13px;
            color: #666;
        }
        .header .logo {
            font-size: 11px;
            color: #999;
            margin-top: 6px;
        }
        .summary-section {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .summary-section h2 {
            background: #d32f2f;
            color: #fff;
            font-size: 14px;
            padding: 10px 16px;
            font-weight: 600;
        }
        .summary-section h2.green { background: #388e3c; }
        .summary-section h2.blue { background: #1976d2; }
        .summary-section h2.orange { background: #f57c00; }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0;
            border-bottom: 1px solid #ddd;
        }
        .kpi-item {
            padding: 16px 20px;
            border-right: 1px solid #eee;
            text-align: center;
        }
        .kpi-item:last-child { border-right: none; }
        .kpi-item .label {
            font-size: 11px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .kpi-item .val {
            font-size: 24px;
            font-weight: 700;
            color: #333;
        }
        .kpi-item .val.ok { color: #388e3c; }
        .kpi-item .val.warn { color: #f57c00; }
        .kpi-item .val.err { color: #d32f2f; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        thead th {
            background: #fafafa;
            border-bottom: 2px solid #ddd;
            padding: 10px 12px;
            text-align: center;
            font-weight: 600;
            color: #555;
            font-size: 11px;
            text-transform: uppercase;
        }
        thead th:first-child { text-align: left; }
        tbody td {
            padding: 9px 12px;
            border-bottom: 1px solid #eee;
            text-align: center;
        }
        tbody td:first-child {
            text-align: left;
            font-weight: 500;
        }
        tbody tr:hover { background: #f9f9f9; }
        tbody tr.total-row {
            background: #fff3e0;
            font-weight: 700;
        }
        .status-pass {
            display: inline-block;
            background: #e8f5e9;
            color: #2e7d32;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
        }
        .status-fail {
            display: inline-block;
            background: #ffebee;
            color: #c62828;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
        }
        .chart-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        @media (max-width: 900px) {
            .chart-grid { grid-template-columns: 1fr; }
        }
        .chart-box {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 20px;
        }
        .chart-box h3 {
            font-size: 13px;
            color: #555;
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        .footer {
            text-align: center;
            padding: 16px;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report - Summary</h1>
        <div class="subtitle">Fecha: ${new Date().toLocaleString('es-AR')} | Endpoint: POST /auth/registro</div>
        <div class="logo">Generado con k6 | Formato estilo JMeter Aggregate Report</div>
    </div>

    <!-- KPIs -->
    <div class="summary-section">
        <h2>Resumen General</h2>
        <div class="kpi-grid">
            <div class="kpi-item">
                <div class="label"># Samples</div>
                <div class="val">${samples}</div>
            </div>
            <div class="kpi-item">
                <div class="label">Throughput</div>
                <div class="val">${throughput.toFixed(2)}/s</div>
            </div>
            <div class="kpi-item">
                <div class="label">Average (ms)</div>
                <div class="val">${(httpReqDuration.avg || 0).toFixed(0)}</div>
            </div>
            <div class="kpi-item">
                <div class="label">Error %</div>
                <div class="val ${errorRate > 0.1 ? 'err' : errorRate > 0 ? 'warn' : 'ok'}">${(errorRate * 100).toFixed(2)}%</div>
            </div>
            <div class="kpi-item">
                <div class="label">VUs Max</div>
                <div class="val">${vusMax.max || vus.max || 0}</div>
            </div>
            <div class="kpi-item">
                <div class="label">Checks Pass</div>
                <div class="val ${(checks.rate || 0) >= 0.95 ? 'ok' : 'err'}">${((checks.rate || 0) * 100).toFixed(1)}%</div>
            </div>
        </div>
    </div>

    <!-- JMeter Aggregate Report Table -->
    <div class="summary-section">
        <h2 class="blue">Aggregate Report (estilo JMeter)</h2>
        <table>
            <thead>
                <tr>
                    <th>Label</th>
                    <th># Samples</th>
                    <th>Average</th>
                    <th>Median</th>
                    <th>90% Line</th>
                    <th>95% Line</th>
                    <th>99% Line</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Error %</th>
                    <th>Throughput</th>
                    <th>Received KB/s</th>
                    <th>Sent KB/s</th>
                </tr>
            </thead>
            <tbody>
                <tr class="total-row">
                    <td>POST /auth/registro</td>
                    <td>${samples}</td>
                    <td>${(httpReqDuration.avg || 0).toFixed(0)}</td>
                    <td>${(httpReqDuration.med || 0).toFixed(0)}</td>
                    <td>${(httpReqDuration['p(90)'] || 0).toFixed(0)}</td>
                    <td>${(httpReqDuration['p(95)'] || 0).toFixed(0)}</td>
                    <td>${(httpReqDuration['p(99)'] || httpReqDuration['p(95)'] || 0).toFixed(0)}</td>
                    <td>${(httpReqDuration.min || 0).toFixed(0)}</td>
                    <td>${(httpReqDuration.max || 0).toFixed(0)}</td>
                    <td><span class="${errorRate > 0 ? 'status-fail' : 'status-pass'}">${(errorRate * 100).toFixed(2)}%</span></td>
                    <td>${throughput.toFixed(2)}/s</td>
                    <td>${receivedKBs.toFixed(2)}</td>
                    <td>${sentKBs.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Response Times Table -->
    <div class="summary-section">
        <h2 class="green">Response Times Breakdown (ms)</h2>
        <table>
            <thead>
                <tr>
                    <th>Phase</th>
                    <th>Average</th>
                    <th>Min</th>
                    <th>Median</th>
                    <th>Max</th>
                    <th>P90</th>
                    <th>P95</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Duration</td>
                    <td>${(httpReqDuration.avg || 0).toFixed(2)}</td>
                    <td>${(httpReqDuration.min || 0).toFixed(2)}</td>
                    <td>${(httpReqDuration.med || 0).toFixed(2)}</td>
                    <td>${(httpReqDuration.max || 0).toFixed(2)}</td>
                    <td>${(httpReqDuration['p(90)'] || 0).toFixed(2)}</td>
                    <td>${(httpReqDuration['p(95)'] || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Blocked</td>
                    <td>${(httpReqBlocked.avg || 0).toFixed(2)}</td>
                    <td>${(httpReqBlocked.min || 0).toFixed(2)}</td>
                    <td>${(httpReqBlocked.med || 0).toFixed(2)}</td>
                    <td>${(httpReqBlocked.max || 0).toFixed(2)}</td>
                    <td>${(httpReqBlocked['p(90)'] || 0).toFixed(2)}</td>
                    <td>${(httpReqBlocked['p(95)'] || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Connecting</td>
                    <td>${(httpReqConnecting.avg || 0).toFixed(2)}</td>
                    <td>${(httpReqConnecting.min || 0).toFixed(2)}</td>
                    <td>${(httpReqConnecting.med || 0).toFixed(2)}</td>
                    <td>${(httpReqConnecting.max || 0).toFixed(2)}</td>
                    <td>${(httpReqConnecting['p(90)'] || 0).toFixed(2)}</td>
                    <td>${(httpReqConnecting['p(95)'] || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>TLS Handshaking</td>
                    <td>${(httpReqTlsHandshaking.avg || 0).toFixed(2)}</td>
                    <td>${(httpReqTlsHandshaking.min || 0).toFixed(2)}</td>
                    <td>${(httpReqTlsHandshaking.med || 0).toFixed(2)}</td>
                    <td>${(httpReqTlsHandshaking.max || 0).toFixed(2)}</td>
                    <td>${(httpReqTlsHandshaking['p(90)'] || 0).toFixed(2)}</td>
                    <td>${(httpReqTlsHandshaking['p(95)'] || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Sending</td>
                    <td>${(httpReqSending.avg || 0).toFixed(2)}</td>
                    <td>${(httpReqSending.min || 0).toFixed(2)}</td>
                    <td>${(httpReqSending.med || 0).toFixed(2)}</td>
                    <td>${(httpReqSending.max || 0).toFixed(2)}</td>
                    <td>${(httpReqSending['p(90)'] || 0).toFixed(2)}</td>
                    <td>${(httpReqSending['p(95)'] || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Waiting (TTFB)</td>
                    <td>${(httpReqWaiting.avg || 0).toFixed(2)}</td>
                    <td>${(httpReqWaiting.min || 0).toFixed(2)}</td>
                    <td>${(httpReqWaiting.med || 0).toFixed(2)}</td>
                    <td>${(httpReqWaiting.max || 0).toFixed(2)}</td>
                    <td>${(httpReqWaiting['p(90)'] || 0).toFixed(2)}</td>
                    <td>${(httpReqWaiting['p(95)'] || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Receiving</td>
                    <td>${(httpReqReceiving.avg || 0).toFixed(2)}</td>
                    <td>${(httpReqReceiving.min || 0).toFixed(2)}</td>
                    <td>${(httpReqReceiving.med || 0).toFixed(2)}</td>
                    <td>${(httpReqReceiving.max || 0).toFixed(2)}</td>
                    <td>${(httpReqReceiving['p(90)'] || 0).toFixed(2)}</td>
                    <td>${(httpReqReceiving['p(95)'] || 0).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Charts -->
    <div class="chart-grid">
        <div class="chart-box">
            <h3>Response Time Distribution (ms)</h3>
            <canvas id="responseTimeChart"></canvas>
        </div>
        <div class="chart-box">
            <h3>Response Time Percentiles (ms)</h3>
            <canvas id="percentileChart"></canvas>
        </div>
    </div>

    <div class="chart-grid">
        <div class="chart-box">
            <h3>Request Phases Avg (ms)</h3>
            <canvas id="phasesChart"></canvas>
        </div>
        <div class="chart-box">
            <h3>Pass / Fail Rate</h3>
            <canvas id="successChart"></canvas>
        </div>
    </div>

    <div class="summary-section">
        <h2 class="orange">Data Transfer</h2>
        <div class="kpi-grid">
            <div class="kpi-item">
                <div class="label">Total Received</div>
                <div class="val">${((dataReceived.count || 0) / 1024).toFixed(2)} KB</div>
            </div>
            <div class="kpi-item">
                <div class="label">Total Sent</div>
                <div class="val">${((dataSent.count || 0) / 1024).toFixed(2)} KB</div>
            </div>
            <div class="kpi-item">
                <div class="label">Received Rate</div>
                <div class="val">${receivedKBs.toFixed(2)} KB/s</div>
            </div>
            <div class="kpi-item">
                <div class="label">Sent Rate</div>
                <div class="val">${sentKBs.toFixed(2)} KB/s</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Generated by k6 + Custom Reporter | JMeter-style Summary | ${fecha}</p>
    </div>

    <script>
        // Response Time Bar Chart
        new Chart(document.getElementById('responseTimeChart'), {
            type: 'bar',
            data: {
                labels: ['Avg', 'Min', 'Median', 'P90', 'P95', 'Max'],
                datasets: [{
                    label: 'ms',
                    data: [${httpReqDuration.avg || 0}, ${httpReqDuration.min || 0}, ${httpReqDuration.med || 0}, ${httpReqDuration['p(90)'] || 0}, ${httpReqDuration['p(95)'] || 0}, ${httpReqDuration.max || 0}],
                    backgroundColor: ['#1976d2', '#388e3c', '#7b1fa2', '#f57c00', '#d32f2f', '#c62828'],
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // Percentile Line Chart
        new Chart(document.getElementById('percentileChart'), {
            type: 'line',
            data: {
                labels: ['Min', 'P50', 'P90', 'P95', 'Max'],
                datasets: [{
                    label: 'Response Time (ms)',
                    data: [${httpReqDuration.min || 0}, ${httpReqDuration.med || 0}, ${httpReqDuration['p(90)'] || 0}, ${httpReqDuration['p(95)'] || 0}, ${httpReqDuration.max || 0}],
                    borderColor: '#d32f2f',
                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#d32f2f',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // Request Phases Horizontal Bar
        new Chart(document.getElementById('phasesChart'), {
            type: 'bar',
            data: {
                labels: ['Blocked', 'Connecting', 'TLS', 'Sending', 'Waiting', 'Receiving'],
                datasets: [{
                    label: 'Avg (ms)',
                    data: [${httpReqBlocked.avg || 0}, ${httpReqConnecting.avg || 0}, ${httpReqTlsHandshaking.avg || 0}, ${httpReqSending.avg || 0}, ${httpReqWaiting.avg || 0}, ${httpReqReceiving.avg || 0}],
                    backgroundColor: ['#90a4ae', '#f57c00', '#7b1fa2', '#1976d2', '#388e3c', '#00897b'],
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });

        // Pass/Fail Doughnut
        const passRate = ${(checks.rate || 0) * 100};
        new Chart(document.getElementById('successChart'), {
            type: 'doughnut',
            data: {
                labels: ['Passed (' + passRate.toFixed(1) + '%)', 'Failed (' + (100 - passRate).toFixed(1) + '%)'],
                datasets: [{
                    data: [passRate, 100 - passRate],
                    backgroundColor: ['#388e3c', '#d32f2f'],
                    borderWidth: 2,
                    borderColor: '#fff',
                }]
            },
            options: {
                responsive: true,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 12 } } },
                }
            }
        });
    </script>
</body>
</html>`;

    return { filePath, html };
}
