$(document).ready(function () {
    
    const celdas = $('.celda');

    const combinacionesGanadoras = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    let turnoActual = 'X';
    let juegoTerminado = false;

    $('.celda').on('click', function () {
        if ($(this).text() !== '' || juegoTerminado) {
            return;
        }

        $(this).text(turnoActual);

        if (hayGanador()) {
            $('#mensaje-final').text(`¡Ha ganado ${turnoActual}!`);
            juegoTerminado = true;
            return;
        }

        if (tableroLleno()) {
            $('#mensaje-final').text('Empate');
            juegoTerminado = true;
            return;
        }

        turnoActual = turnoActual === 'X' ? 'O' : 'X';
        $('#turno-actual').text(turnoActual);
    });

    function hayGanador() {
        for (let i = 0; i < combinacionesGanadoras.length; i++) {
            const combinacion = combinacionesGanadoras[i];

            const a = combinacion[0];
            const b = combinacion[1];
            const c = combinacion[2];

            const valorA = celdas.eq(a).text();
            const valorB = celdas.eq(b).text();
            const valorC = celdas.eq(c).text();

            if (valorA !== '' && valorA === valorB && valorB === valorC) {
                return true;
            }
        }
        return false;
    }

    function tableroLleno() {
        for (let i = 0; i < celdas.length; i++) {
            if (celdas.eq(i).text() === '') {
                return false;
            }
        }
        return true;
    }

    $('#btn-reiniciar').on('click', function () {
        $('.celda').text('');
        turnoActual = 'X';
        juegoTerminado = false;
        $('#turno-actual').text(turnoActual);
        $('#mensaje-final').text('');
    });
});
