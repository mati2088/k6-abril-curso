/**
 * Script Node.js para loguear usuarios y guardar tokens
 * Ejecutar con: node loginUsuarios.js
 * 
 * Lee los usuarios de data/users.json, intenta loguear cada uno,
 * y guarda los tokens exitosos en data/usersLogueados.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://homebanking-demo.onrender.com';
const ENDPOINT = '/auth/login';
const BATCH_SIZE = 10; // requests concurrentes por lote

async function loginUser(user) {
    const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            username: user.username,
            password: user.password,
        }),
    });

    const body = await res.json();

    return {
        status: res.status,
        exito: body.exito || false,
        username: body.username || user.username,
        name: body.name || user.name,
        token: body.token || null,
        mensaje: body.mensaje || null,
    };
}

async function procesarEnLotes(users) {
    const exitosos = [];
    const fallidos = [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const lote = users.slice(i, i + BATCH_SIZE);
        const loteNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalLotes = Math.ceil(users.length / BATCH_SIZE);

        process.stdout.write(`\r  Procesando lote ${loteNum}/${totalLotes} (${i + lote.length}/${users.length} usuarios)...`);

        const resultados = await Promise.allSettled(
            lote.map(user => loginUser(user))
        );

        for (let j = 0; j < resultados.length; j++) {
            const resultado = resultados[j];
            const user = lote[j];

            if (resultado.status === 'fulfilled') {
                const data = resultado.value;
                if (data.status === 200 && data.exito === true && data.token) {
                    exitosos.push({
                        username: data.username,
                        name: data.name,
                        token: data.token,
                    });
                } else {
                    fallidos.push({
                        username: user.username,
                        razon: data.mensaje || `Status ${data.status}`,
                    });
                }
            } else {
                fallidos.push({
                    username: user.username,
                    razon: resultado.reason?.message || 'Error de conexión',
                });
            }
        }
    }

    console.log(''); // salto de linea despues del progreso
    return { exitosos, fallidos };
}

async function main() {
    console.log('\n========================================');
    console.log('   LOGIN MASIVO DE USUARIOS');
    console.log('========================================\n');

    // Leer usuarios
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    console.log(`  Usuarios encontrados: ${users.length}`);
    console.log(`  Endpoint: POST ${BASE_URL}${ENDPOINT}`);
    console.log(`  Concurrencia: ${BATCH_SIZE} requests por lote\n`);

    // Loguear usuarios
    const { exitosos, fallidos } = await procesarEnLotes(users);

    // Guardar tokens en usersLogueados.js (formato importable por k6)
    const outputPath = path.join(__dirname, 'data', 'usersLogueados.json');
    const contenido = JSON.stringify(exitosos, null, 4);
    fs.writeFileSync(outputPath, contenido, 'utf-8');

    // Resumen
    console.log('\n========================================');
    console.log('   RESULTADO');
    console.log('========================================');
    console.log(`  Total usuarios:   ${users.length}`);
    console.log(`  Login exitoso:    ${exitosos.length}`);
    console.log(`  Login fallido:    ${fallidos.length}`);
    console.log(`  Tasa de éxito:    ${((exitosos.length / users.length) * 100).toFixed(1)}%`);
    console.log(`  Archivo guardado: ${outputPath}`);
    console.log('========================================\n');

    if (fallidos.length > 0 && fallidos.length <= 20) {
        console.log('  Usuarios fallidos:');
        fallidos.forEach(f => console.log(`    - ${f.username}: ${f.razon}`));
        console.log('');
    } else if (fallidos.length > 20) {
        console.log(`  Primeros 20 usuarios fallidos:`);
        fallidos.slice(0, 20).forEach(f => console.log(`    - ${f.username}: ${f.razon}`));
        console.log(`    ... y ${fallidos.length - 20} más\n`);
    }
}

main().catch(err => {
    console.error('Error fatal:', err.message);
    process.exit(1);
});
