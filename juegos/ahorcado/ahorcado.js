$(document).ready(function () {
    const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    const PARTES = [
        '#parte-cabeza-juego',
        '#parte-cuerpo-juego',
        '#parte-brazo-izq-juego',
        '#parte-brazo-der-juego',
        '#parte-pierna-izq-juego',
        '#parte-pierna-der-juego'
    ];
    const FALLOS_MAXIMOS = PARTES.length;

    let nivelActual = '';
    let palabra = '';
    let letrasAcertadas = [];
    let fallos = 0;
    let terminado = false;

    function crearTeclado() {
        $('#letras-teclado').html('');

        for (let i = 0; i < LETRAS.length; i++) {
            const letra = LETRAS[i];
            $('#letras-teclado').append(`
                <button type="button" class="btn btn-outline-secondary m-1" data-letra="${letra}">${letra}</button>
            `);
        }
    }

    // Elige una palabra al azar del nivel, distinta de la anterior
    function elegirPalabra() {
        const lista = palabras[nivelActual];
        let nueva = '';

        do {
            nueva = lista[Math.floor(Math.random() * lista.length)];
        } while (nueva === palabra && lista.length > 1);

        return nueva;
    }

    // Pinta un hueco por letra. Con mostrarTodo se ven también las no acertadas (en rojo)
    function pintarPalabra(mostrarTodo) {
        $('#palabra-oculta').html('');

        for (let i = 0; i < palabra.length; i++) {
            const letra = palabra[i];
            const acertada = letrasAcertadas.includes(letra);

            if (acertada) {
                $('#palabra-oculta').append(`<span class="hueco">${letra}</span>`);
            } else if (mostrarTodo) {
                $('#palabra-oculta').append(`<span class="hueco text-danger">${letra}</span>`);
            } else {
                $('#palabra-oculta').append(`<span class="hueco"></span>`);
            }
        }
    }

    function palabraCompleta() {
        for (let i = 0; i < palabra.length; i++) {
            if (!letrasAcertadas.includes(palabra[i])) {
                return false;
            }
        }
        return true;
    }

    function empezarPartida() {
        palabra = elegirPalabra();
        letrasAcertadas = [];
        fallos = 0;
        terminado = false;

        crearTeclado();
        pintarPalabra(false);
        $('#fallos').text(fallos);
        $('#mensaje-final').text('').removeClass('alert-success alert-danger').addClass('d-none');

        for (let i = 0; i < PARTES.length; i++) {
            $(PARTES[i]).addClass('oculto');
        }
    }

    function terminarPartida(texto, tipo) {
        terminado = true;
        $('#letras-teclado [data-letra]').prop('disabled', true);
        $('#mensaje-final').text(texto).removeClass('d-none').addClass(`alert-${tipo}`);
    }

    $('#letras-teclado').on('click', '[data-letra]', function () {
        if (terminado) {
            return;
        }

        const letra = $(this).data('letra');
        $(this).prop('disabled', true).removeClass('btn-outline-secondary');

        if (palabra.includes(letra)) {
            letrasAcertadas.push(letra);
            $(this).addClass('btn-success');
            pintarPalabra(false);

            if (palabraCompleta()) {
                terminarPartida(`¡Has ganado! La palabra era ${palabra}`, 'success');
            }
        } else {
            $(PARTES[fallos]).removeClass('oculto');
            fallos++;
            $('#fallos').text(fallos);
            $(this).addClass('btn-danger');

            if (fallos === FALLOS_MAXIMOS) {
                pintarPalabra(true);
                terminarPartida(`Has perdido. La palabra era ${palabra}`, 'danger');
            }
        }
    });

    // También se puede jugar con el teclado del ordenador
    $(document).on('keydown', function (evento) {
        if ($('#juego').hasClass('d-none') || evento.ctrlKey || evento.altKey || evento.metaKey) {
            return;
        }

        const letra = evento.key.toUpperCase();
        if (letra.length !== 1 || !LETRAS.includes(letra)) {
            return;
        }

        $(`#letras-teclado [data-letra="${letra}"]`).not(':disabled').trigger('click');
    });

    $('#btn-jugar').on('click', function () {
        const nivel = $('#nivel').val();

        if (nivel === '') {
            $('#nivel').addClass('is-invalid');
            return;
        }

        nivelActual = nivel;
        empezarPartida();
        $('#portada').addClass('d-none');
        $('#juego').removeClass('d-none');
    });

    $('#nivel').on('change', function () {
        $(this).removeClass('is-invalid');
    });

    $('#btn-reiniciar').on('click', function () {
        empezarPartida();
    });

    $('#btn-cambiar-nivel').on('click', function () {
        $('#juego').addClass('d-none');
        $('#portada').removeClass('d-none');
    });
});
