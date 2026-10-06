// Los sudokus están en sudokus.js (variable "niveles")

const tablero = document.getElementById('tablero');
const botonesNivel = document.querySelectorAll('[data-nivel]');
const paginacion = document.getElementById('paginacion');
const tituloSudoku = document.getElementById('titulo-sudoku');
const badgeResuelto = document.getElementById('badge-resuelto');
const tiempoTexto = document.getElementById('tiempo');
const pistasTexto = document.getElementById('pistas-restantes');
const barraProgreso = document.getElementById('barra-progreso');
const progresoTexto = document.getElementById('progreso-texto');
const teclado = document.getElementById('teclado');
const btnComprobar = document.getElementById('btn-comprobar');
const btnPista = document.getElementById('btn-pista');
const btnReiniciar = document.getElementById('btn-reiniciar');
const btnSiguiente = document.getElementById('btn-siguiente');
const avisoElemento = document.getElementById('aviso');
const avisoTexto = document.getElementById('aviso-texto');
const resumenVictoria = document.getElementById('resumen-victoria');

const aviso = bootstrap.Toast.getOrCreateInstance(avisoElemento, { delay: 2500 });
const modalVictoria = new bootstrap.Modal(document.getElementById('modal-victoria'));

const PISTAS_MAXIMAS = 3;
const ordenNiveles = Object.keys(niveles); // ['facil', 'medio', 'dificil']

let nivelActual = 'facil';
let indiceActual = 0;
let celdas = [];
let celdaSeleccionada = null;
let pistasRestantes = PISTAS_MAXIMAS;
let terminado = false;
let segundos = 0;
let cronometro = null;
let resueltos = cargarResueltos();

// ---------- Guardar sudokus resueltos en el navegador ----------

function cargarResueltos() {
    try {
        return JSON.parse(localStorage.getItem('sudoku-resueltos')) || [];
    } catch (error) {
        return [];
    }
}

function guardarResueltos() {
    try {
        localStorage.setItem('sudoku-resueltos', JSON.stringify(resueltos));
    } catch (error) {
        // Si el navegador no deja guardar, el juego sigue funcionando igual
    }
}

function claveSudoku(nivel, indice) {
    return `${nivel}-${indice}`;
}

function estaResuelto(nivel, indice) {
    return resueltos.includes(claveSudoku(nivel, indice));
}

// ---------- Cargar un sudoku ----------

function cargarSudoku(nivel, indice) {
    nivelActual = nivel;
    indiceActual = indice;
    celdaSeleccionada = null;
    pistasRestantes = PISTAS_MAXIMAS;
    terminado = false;

    crearTablero();
    crearTeclado();
    pintarNiveles();
    pintarPaginacion();

    tituloSudoku.textContent = `${niveles[nivel].nombre} · Sudoku ${indice + 1}`;
    badgeResuelto.classList.toggle('d-none', !estaResuelto(nivel, indice));
    pistasTexto.textContent = pistasRestantes;
    btnPista.disabled = false;

    actualizarProgreso();
    actualizarTeclado();
    reiniciarCronometro();
}

function crearTablero() {
    const nivel = niveles[nivelActual];
    const n = nivel.tamano;
    const sudoku = niveles[nivelActual].sudokus[indiceActual];

    tablero.innerHTML = '';
    tablero.classList.remove('celebrar');
    tablero.style.setProperty('--tamano', n);
    celdas = [];

    for (let i = 0; i < n * n; i++) {
        const celda = document.createElement('input');
        celda.type = 'text';
        celda.inputMode = 'numeric';
        celda.maxLength = 1;
        celda.autocomplete = 'off';
        celda.classList.add('celda');

        const fila = Math.floor(i / n);
        const columna = i % n;
        const bloque = Math.floor(fila / nivel.bloqueFilas) * (n / nivel.bloqueColumnas) + Math.floor(columna / nivel.bloqueColumnas);
        celda.dataset.fila = fila;
        celda.dataset.columna = columna;
        celda.dataset.bloque = bloque;
        celda.setAttribute('aria-label', `Fila ${fila + 1}, columna ${columna + 1}`);

        // Bordes gruesos al final de cada bloque (menos en el borde exterior)
        if (columna % nivel.bloqueColumnas === nivel.bloqueColumnas - 1 && columna !== n - 1) {
            celda.classList.add('borde-derecha');
        }
        if (fila % nivel.bloqueFilas === nivel.bloqueFilas - 1 && fila !== n - 1) {
            celda.classList.add('borde-abajo');
        }

        if (sudoku.inicial[i] !== '0') {
            celda.value = sudoku.inicial[i];
            celda.readOnly = true;
            celda.classList.add('fija');
        }

        celda.addEventListener('focus', function () {
            celdaSeleccionada = i;
            celda.select();
            resaltar();
        });

        celda.addEventListener('keydown', function (evento) {
            manejarTecla(evento, i);
        });

        // Para móviles (su teclado no siempre avisa en keydown)
        celda.addEventListener('input', function () {
            escribirNumero(i, celda.value.slice(-1));
        });

        tablero.appendChild(celda);
        celdas.push(celda);
    }
}

// ---------- Escribir y moverse ----------

function manejarTecla(evento, i) {
    const n = niveles[nivelActual].tamano;
    const movimientos = { ArrowUp: -n, ArrowDown: n, ArrowLeft: -1, ArrowRight: 1 };

    if (movimientos[evento.key] !== undefined) {
        evento.preventDefault();
        const destino = i + movimientos[evento.key];
        const mismaFila = Math.floor(destino / n) === Math.floor(i / n);
        const esHorizontal = evento.key === 'ArrowLeft' || evento.key === 'ArrowRight';

        if (destino >= 0 && destino < n * n && (!esHorizontal || mismaFila)) {
            celdas[destino].focus();
        }
        return;
    }

    if (evento.key === 'Backspace' || evento.key === 'Delete') {
        evento.preventDefault();
        escribirNumero(i, '');
        return;
    }

    // Cualquier otra tecla de un solo carácter: solo dejamos pasar números válidos
    if (evento.key.length === 1) {
        evento.preventDefault();
        if (esNumeroValido(evento.key)) {
            escribirNumero(i, evento.key);
        }
    }
}

function esNumeroValido(valor) {
    const n = niveles[nivelActual].tamano;
    return valor.length === 1 && valor >= '1' && valor <= String(n);
}

function escribirNumero(i, valor) {
    const celda = celdas[i];
    if (terminado || celda.readOnly) {
        return;
    }

    if (!esNumeroValido(valor)) {
        valor = '';
    }

    celda.value = valor;
    celda.classList.remove('error', 'pista');

    resaltar();
    actualizarProgreso();
    actualizarTeclado();
    comprobarVictoria();
}

// ---------- Resaltar fila, columna, bloque y números iguales ----------

function resaltar() {
    for (let j = 0; j < celdas.length; j++) {
        celdas[j].classList.remove('resaltada', 'mismo-numero', 'seleccionada');
    }

    if (celdaSeleccionada === null) {
        return;
    }

    const elegida = celdas[celdaSeleccionada];

    for (let j = 0; j < celdas.length; j++) {
        const celda = celdas[j];
        if (celda.dataset.fila === elegida.dataset.fila ||
            celda.dataset.columna === elegida.dataset.columna ||
            celda.dataset.bloque === elegida.dataset.bloque) {
            celda.classList.add('resaltada');
        }
        if (elegida.value !== '' && celda.value === elegida.value) {
            celda.classList.add('mismo-numero');
        }
    }

    elegida.classList.add('seleccionada');
}

// ---------- Teclado numérico en pantalla ----------

function crearTeclado() {
    const nivel = niveles[nivelActual];
    teclado.innerHTML = '';
    teclado.style.setProperty('--columnas', nivel.bloqueColumnas);

    for (let numero = 1; numero <= nivel.tamano; numero++) {
        const tecla = document.createElement('button');
        tecla.type = 'button';
        tecla.className = 'btn btn-outline-dark tecla';
        tecla.dataset.numero = numero;
        tecla.innerHTML = `${numero}<small></small>`;
        tecla.addEventListener('click', function () {
            pulsarTecla(String(numero));
        });
        teclado.appendChild(tecla);
    }

    const borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'btn btn-outline-secondary tecla tecla-borrar';
    borrar.textContent = '⌫ Borrar';
    borrar.addEventListener('click', function () {
        pulsarTecla('');
    });
    teclado.appendChild(borrar);
}

function pulsarTecla(valor) {
    if (celdaSeleccionada === null) {
        mostrarAviso('Primero elige una casilla del tablero', 'secondary');
        return;
    }
    escribirNumero(celdaSeleccionada, valor);
}

// Cada tecla muestra cuántas veces falta poner ese número
function actualizarTeclado() {
    const n = niveles[nivelActual].tamano;
    const teclas = teclado.querySelectorAll('[data-numero]');

    for (let t = 0; t < teclas.length; t++) {
        const numero = teclas[t].dataset.numero;
        let veces = 0;
        for (let i = 0; i < celdas.length; i++) {
            if (celdas[i].value === numero) {
                veces++;
            }
        }
        const faltan = n - veces;
        teclas[t].querySelector('small').textContent = faltan > 0 ? faltan : '';
        teclas[t].classList.toggle('completa', faltan <= 0);
    }
}

// ---------- Progreso, cronómetro y avisos ----------

function actualizarProgreso() {
    let total = 0;
    let rellenas = 0;

    for (let i = 0; i < celdas.length; i++) {
        if (!celdas[i].classList.contains('fija')) {
            total++;
            if (celdas[i].value !== '') {
                rellenas++;
            }
        }
    }

    const porcentaje = Math.round(rellenas / total * 100);
    barraProgreso.style.width = `${porcentaje}%`;
    progresoTexto.textContent = `${rellenas}/${total}`;
}

function formatearTiempo(totalSegundos) {
    const minutos = String(Math.floor(totalSegundos / 60)).padStart(2, '0');
    const segs = String(totalSegundos % 60).padStart(2, '0');
    return `${minutos}:${segs}`;
}

function reiniciarCronometro() {
    clearInterval(cronometro);
    segundos = 0;
    tiempoTexto.textContent = formatearTiempo(segundos);
    cronometro = setInterval(function () {
        segundos++;
        tiempoTexto.textContent = formatearTiempo(segundos);
    }, 1000);
}

function mostrarAviso(texto, tipo) {
    avisoElemento.className = `toast align-items-center border-0 text-bg-${tipo}`;
    avisoTexto.textContent = texto;
    aviso.show();
}

// ---------- Niveles y paginación ----------

function pintarNiveles() {
    for (let i = 0; i < botonesNivel.length; i++) {
        const nivel = botonesNivel[i].dataset.nivel;
        botonesNivel[i].classList.toggle('active', nivel === nivelActual);

        let cuantos = 0;
        for (let j = 0; j < niveles[nivel].sudokus.length; j++) {
            if (estaResuelto(nivel, j)) {
                cuantos++;
            }
        }
        document.querySelector(`[data-contador="${nivel}"]`).textContent = `${cuantos}/${niveles[nivel].sudokus.length} resueltos`;
    }
}

function pintarPaginacion() {
    const total = niveles[nivelActual].sudokus.length;
    let html = '';

    html += `<li class="page-item ${indiceActual === 0 ? 'disabled' : ''}">
        <button type="button" class="page-link" data-pagina="${indiceActual - 1}" aria-label="Anterior">&laquo;</button>
    </li>`;

    for (let i = 0; i < total; i++) {
        const activa = i === indiceActual ? 'active' : '';
        const resuelto = estaResuelto(nivelActual, i) ? 'resuelto' : '';
        html += `<li class="page-item ${activa} ${resuelto}">
            <button type="button" class="page-link" data-pagina="${i}">${i + 1}</button>
        </li>`;
    }

    html += `<li class="page-item ${indiceActual === total - 1 ? 'disabled' : ''}">
        <button type="button" class="page-link" data-pagina="${indiceActual + 1}" aria-label="Siguiente">&raquo;</button>
    </li>`;

    paginacion.innerHTML = html;
}

// Un solo listener para todos los botones de la paginación
paginacion.addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-pagina]');
    if (!boton || boton.parentElement.classList.contains('disabled')) {
        return;
    }
    cargarSudoku(nivelActual, Number(boton.dataset.pagina));
});

for (let i = 0; i < botonesNivel.length; i++) {
    botonesNivel[i].addEventListener('click', function () {
        cargarSudoku(botonesNivel[i].dataset.nivel, 0);
    });
}

// ---------- Botones ----------

btnComprobar.addEventListener('click', function () {
    if (terminado) {
        mostrarAviso('Este sudoku ya está resuelto 🎉', 'success');
        return;
    }

    const solucion = niveles[nivelActual].sudokus[indiceActual].solucion;
    let errores = 0;
    let vacias = 0;

    for (let i = 0; i < celdas.length; i++) {
        if (celdas[i].value === '') {
            vacias++;
        } else if (celdas[i].value !== solucion[i]) {
            celdas[i].classList.add('error');
            errores++;
        }
    }

    if (errores > 0) {
        mostrarAviso(`Hay ${errores} casilla(s) mal. Están marcadas en rojo`, 'danger');
    } else {
        mostrarAviso(`¡Todo bien! Te faltan ${vacias} casilla(s)`, 'success');
    }
});

btnPista.addEventListener('click', function () {
    if (terminado) {
        return;
    }
    if (pistasRestantes === 0) {
        mostrarAviso('Ya no te quedan pistas', 'warning');
        return;
    }

    const solucion = niveles[nivelActual].sudokus[indiceActual].solucion;

    // Casillas que se pueden desvelar: no fijas y vacías o mal
    const candidatas = [];
    for (let i = 0; i < celdas.length; i++) {
        if (!celdas[i].readOnly && celdas[i].value !== solucion[i]) {
            candidatas.push(i);
        }
    }

    // Si la casilla seleccionada es candidata, la pista va ahí; si no, a una al azar
    let elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
    if (candidatas.includes(celdaSeleccionada)) {
        elegida = celdaSeleccionada;
    }

    pistasRestantes--;
    pistasTexto.textContent = pistasRestantes;
    btnPista.disabled = pistasRestantes === 0;

    escribirNumero(elegida, solucion[elegida]);
    celdas[elegida].readOnly = true;
    celdas[elegida].classList.add('pista');
});

btnReiniciar.addEventListener('click', function () {
    cargarSudoku(nivelActual, indiceActual);
});

btnSiguiente.addEventListener('click', function () {
    modalVictoria.hide();
    siguienteSudoku();
});

// ---------- Ganar ----------

function comprobarVictoria() {
    const solucion = niveles[nivelActual].sudokus[indiceActual].solucion;

    for (let i = 0; i < celdas.length; i++) {
        if (celdas[i].value !== solucion[i]) {
            return;
        }
    }

    ganar();
}

function ganar() {
    terminado = true;
    clearInterval(cronometro);

    if (!estaResuelto(nivelActual, indiceActual)) {
        resueltos.push(claveSudoku(nivelActual, indiceActual));
        guardarResueltos();
    }

    // Bloquear el tablero y lanzar la animación en diagonal
    for (let i = 0; i < celdas.length; i++) {
        celdas[i].readOnly = true;
        celdas[i].style.animationDelay = `${(Number(celdas[i].dataset.fila) + Number(celdas[i].dataset.columna)) * 60}ms`;
    }
    celdaSeleccionada = null;
    resaltar();
    tablero.classList.add('celebrar');

    badgeResuelto.classList.remove('d-none');
    pintarNiveles();
    pintarPaginacion();

    const pistasUsadas = PISTAS_MAXIMAS - pistasRestantes;
    resumenVictoria.innerHTML = `${niveles[nivelActual].nombre} · Sudoku ${indiceActual + 1}<br>
        Tiempo: <strong>${formatearTiempo(segundos)}</strong> · Pistas usadas: <strong>${pistasUsadas}</strong>`;

    const posicionNivel = ordenNiveles.indexOf(nivelActual);
    if (indiceActual < niveles[nivelActual].sudokus.length - 1) {
        btnSiguiente.textContent = 'Siguiente sudoku →';
    } else if (posicionNivel < ordenNiveles.length - 1) {
        btnSiguiente.textContent = 'Siguiente nivel →';
    } else {
        btnSiguiente.textContent = 'Volver a empezar ↺';
    }

    setTimeout(function () {
        modalVictoria.show();
    }, 900);
}

function siguienteSudoku() {
    const posicionNivel = ordenNiveles.indexOf(nivelActual);

    if (indiceActual < niveles[nivelActual].sudokus.length - 1) {
        cargarSudoku(nivelActual, indiceActual + 1);
    } else if (posicionNivel < ordenNiveles.length - 1) {
        cargarSudoku(ordenNiveles[posicionNivel + 1], 0);
    } else {
        cargarSudoku(ordenNiveles[0], 0);
    }
}

cargarSudoku('facil', 0);
