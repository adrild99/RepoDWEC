// Los sudokus están en sudokus.js (variable "niveles")

$(document).ready(function () {
    // Bootstrap necesita el elemento HTML "de verdad": con [0] lo sacamos del objeto jQuery
    const aviso = bootstrap.Toast.getOrCreateInstance($('#aviso')[0], { delay: 2500 });
    const modalVictoria = new bootstrap.Modal($('#modal-victoria')[0]);

    const PISTAS_MAXIMAS = 3;
    const ordenNiveles = Object.keys(niveles); // ['facil', 'medio', 'dificil']

    let nivelActual = 'facil';
    let indiceActual = 0;
    let celdas = $();
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

        $('#titulo-sudoku').text(`${niveles[nivel].nombre} · Sudoku ${indice + 1}`);
        $('#badge-resuelto').toggleClass('d-none', !estaResuelto(nivel, indice));
        $('#pistas-restantes').text(pistasRestantes);
        $('#btn-pista').prop('disabled', false);

        actualizarProgreso();
        actualizarTeclado();
        reiniciarCronometro();
    }

    function crearTablero() {
        const nivel = niveles[nivelActual];
        const n = nivel.tamano;
        const sudoku = niveles[nivelActual].sudokus[indiceActual];

        $('#tablero').html('').removeClass('celebrar').css('--tamano', n);

        for (let i = 0; i < n * n; i++) {
            const fila = Math.floor(i / n);
            const columna = i % n;
            const bloque = Math.floor(fila / nivel.bloqueFilas) * (n / nivel.bloqueColumnas) + Math.floor(columna / nivel.bloqueColumnas);

            let clases = 'celda';
            let valor = '';
            let soloLectura = '';

            // Bordes gruesos al final de cada bloque (menos en el borde exterior)
            if (columna % nivel.bloqueColumnas === nivel.bloqueColumnas - 1 && columna !== n - 1) {
                clases += ' borde-derecha';
            }
            if (fila % nivel.bloqueFilas === nivel.bloqueFilas - 1 && fila !== n - 1) {
                clases += ' borde-abajo';
            }

            if (sudoku.inicial[i] !== '0') {
                valor = sudoku.inicial[i];
                soloLectura = 'readonly';
                clases += ' fija';
            }

            $('#tablero').append(`
                <input type="text" inputmode="numeric" maxlength="1" autocomplete="off"
                    class="${clases}" value="${valor}" ${soloLectura}
                    data-indice="${i}" data-fila="${fila}" data-columna="${columna}" data-bloque="${bloque}"
                    aria-label="Fila ${fila + 1}, columna ${columna + 1}">
            `);
        }

        celdas = $('#tablero .celda');
    }

    // Eventos de las celdas: se ponen una sola vez en el tablero
    // y funcionan también con las celdas que se crean después

    $('#tablero').on('focus', '.celda', function () {
        celdaSeleccionada = $(this).data('indice');
        this.select();
        resaltar();
    });

    $('#tablero').on('keydown', '.celda', function (evento) {
        manejarTecla(evento, $(this).data('indice'));
    });

    // Para móviles (su teclado no siempre avisa en keydown)
    $('#tablero').on('input', '.celda', function () {
        escribirNumero($(this).data('indice'), $(this).val().slice(-1));
    });

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
                celdas.eq(destino).trigger('focus');
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
        const celda = celdas.eq(i);
        if (terminado || celda.prop('readOnly')) {
            return;
        }

        if (!esNumeroValido(valor)) {
            valor = '';
        }

        celda.val(valor).removeClass('error pista');

        resaltar();
        actualizarProgreso();
        actualizarTeclado();
        comprobarVictoria();
    }

    // ---------- Resaltar fila, columna, bloque y números iguales ----------

    function resaltar() {
        celdas.removeClass('resaltada mismo-numero seleccionada');

        if (celdaSeleccionada === null) {
            return;
        }

        const elegida = celdas.eq(celdaSeleccionada);

        for (let j = 0; j < celdas.length; j++) {
            const celda = celdas.eq(j);
            if (celda.data('fila') === elegida.data('fila') ||
                celda.data('columna') === elegida.data('columna') ||
                celda.data('bloque') === elegida.data('bloque')) {
                celda.addClass('resaltada');
            }
            if (elegida.val() !== '' && celda.val() === elegida.val()) {
                celda.addClass('mismo-numero');
            }
        }

        elegida.addClass('seleccionada');
    }

    // ---------- Teclado numérico en pantalla ----------

    function crearTeclado() {
        const nivel = niveles[nivelActual];
        $('#teclado').html('').css('--columnas', nivel.bloqueColumnas);

        for (let numero = 1; numero <= nivel.tamano; numero++) {
            $('#teclado').append(`
                <button type="button" class="btn btn-outline-dark tecla" data-numero="${numero}">${numero}<small></small></button>
            `);
        }

        $('#teclado').append(`
            <button type="button" class="btn btn-outline-secondary tecla tecla-borrar">⌫ Borrar</button>
        `);
    }

    $('#teclado').on('click', '[data-numero]', function () {
        pulsarTecla(String($(this).data('numero')));
    });

    $('#teclado').on('click', '.tecla-borrar', function () {
        pulsarTecla('');
    });

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
        const teclas = $('#teclado [data-numero]');

        for (let t = 0; t < teclas.length; t++) {
            const tecla = teclas.eq(t);
            const numero = String(tecla.data('numero'));
            let veces = 0;
            for (let i = 0; i < celdas.length; i++) {
                if (celdas.eq(i).val() === numero) {
                    veces++;
                }
            }
            const faltan = n - veces;
            tecla.find('small').text(faltan > 0 ? faltan : '');
            tecla.toggleClass('completa', faltan <= 0);
        }
    }

    // ---------- Progreso, cronómetro y avisos ----------

    function actualizarProgreso() {
        let total = 0;
        let rellenas = 0;

        for (let i = 0; i < celdas.length; i++) {
            if (!celdas.eq(i).hasClass('fija')) {
                total++;
                if (celdas.eq(i).val() !== '') {
                    rellenas++;
                }
            }
        }

        const porcentaje = Math.round(rellenas / total * 100);
        $('#barra-progreso').css('width', `${porcentaje}%`);
        $('#progreso-texto').text(`${rellenas}/${total}`);
    }

    function formatearTiempo(totalSegundos) {
        const minutos = String(Math.floor(totalSegundos / 60)).padStart(2, '0');
        const segs = String(totalSegundos % 60).padStart(2, '0');
        return `${minutos}:${segs}`;
    }

    function reiniciarCronometro() {
        clearInterval(cronometro);
        segundos = 0;
        $('#tiempo').text(formatearTiempo(segundos));
        cronometro = setInterval(function () {
            segundos++;
            $('#tiempo').text(formatearTiempo(segundos));
        }, 1000);
    }

    function mostrarAviso(texto, tipo) {
        $('#aviso').attr('class', `toast align-items-center border-0 text-bg-${tipo}`);
        $('#aviso-texto').text(texto);
        aviso.show();
    }

    // ---------- Niveles y paginación ----------

    function pintarNiveles() {
        const botonesNivel = $('[data-nivel]');

        for (let i = 0; i < botonesNivel.length; i++) {
            const boton = botonesNivel.eq(i);
            const nivel = boton.data('nivel');
            boton.toggleClass('active', nivel === nivelActual);

            let cuantos = 0;
            for (let j = 0; j < niveles[nivel].sudokus.length; j++) {
                if (estaResuelto(nivel, j)) {
                    cuantos++;
                }
            }
            $(`[data-contador="${nivel}"]`).text(`${cuantos}/${niveles[nivel].sudokus.length} resueltos`);
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

        $('#paginacion').html(html);
    }

    // Un solo listener para todos los botones de la paginación
    $('#paginacion').on('click', '[data-pagina]', function () {
        if ($(this).parent().hasClass('disabled')) {
            return;
        }
        cargarSudoku(nivelActual, $(this).data('pagina'));
    });

    $('[data-nivel]').on('click', function () {
        cargarSudoku($(this).data('nivel'), 0);
    });

    // ---------- Botones ----------

    $('#btn-comprobar').on('click', function () {
        if (terminado) {
            mostrarAviso('Este sudoku ya está resuelto 🎉', 'success');
            return;
        }

        const solucion = niveles[nivelActual].sudokus[indiceActual].solucion;
        let errores = 0;
        let vacias = 0;

        for (let i = 0; i < celdas.length; i++) {
            const valor = celdas.eq(i).val();
            if (valor === '') {
                vacias++;
            } else if (valor !== solucion[i]) {
                celdas.eq(i).addClass('error');
                errores++;
            }
        }

        if (errores > 0) {
            mostrarAviso(`Hay ${errores} casilla(s) mal. Están marcadas en rojo`, 'danger');
        } else {
            mostrarAviso(`¡Todo bien! Te faltan ${vacias} casilla(s)`, 'success');
        }
    });

    $('#btn-pista').on('click', function () {
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
            if (!celdas.eq(i).prop('readOnly') && celdas.eq(i).val() !== solucion[i]) {
                candidatas.push(i);
            }
        }

        // Si la casilla seleccionada es candidata, la pista va ahí; si no, a una al azar
        let elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
        if (candidatas.includes(celdaSeleccionada)) {
            elegida = celdaSeleccionada;
        }

        pistasRestantes--;
        $('#pistas-restantes').text(pistasRestantes);
        $('#btn-pista').prop('disabled', pistasRestantes === 0);

        escribirNumero(elegida, solucion[elegida]);
        celdas.eq(elegida).prop('readOnly', true).addClass('pista');
    });

    $('#btn-reiniciar').on('click', function () {
        cargarSudoku(nivelActual, indiceActual);
    });

    $('#btn-siguiente').on('click', function () {
        modalVictoria.hide();
        siguienteSudoku();
    });

    // ---------- Ganar ----------

    function comprobarVictoria() {
        const solucion = niveles[nivelActual].sudokus[indiceActual].solucion;

        for (let i = 0; i < celdas.length; i++) {
            if (celdas.eq(i).val() !== solucion[i]) {
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
            const celda = celdas.eq(i);
            celda.prop('readOnly', true);
            celda.css('animation-delay', `${(celda.data('fila') + celda.data('columna')) * 60}ms`);
        }
        celdaSeleccionada = null;
        resaltar();
        $('#tablero').addClass('celebrar');

        $('#badge-resuelto').removeClass('d-none');
        pintarNiveles();
        pintarPaginacion();

        const pistasUsadas = PISTAS_MAXIMAS - pistasRestantes;
        $('#resumen-victoria').html(`${niveles[nivelActual].nombre} · Sudoku ${indiceActual + 1}<br>
            Tiempo: <strong>${formatearTiempo(segundos)}</strong> · Pistas usadas: <strong>${pistasUsadas}</strong>`);

        const posicionNivel = ordenNiveles.indexOf(nivelActual);
        if (indiceActual < niveles[nivelActual].sudokus.length - 1) {
            $('#btn-siguiente').text('Siguiente sudoku →');
        } else if (posicionNivel < ordenNiveles.length - 1) {
            $('#btn-siguiente').text('Siguiente nivel →');
        } else {
            $('#btn-siguiente').text('Volver a empezar ↺');
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
});
