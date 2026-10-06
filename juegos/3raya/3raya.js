const celdas = document.querySelectorAll('.celda');
const turnoTexto = document.getElementById('turno-actual');
const mensajeFinal = document.getElementById('mensaje-final');
const btnReiniciar = document.getElementById('btn-reiniciar');

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

celdas.forEach(function (celda) {
    celda.addEventListener('click', function () {
        if (celda.textContent !== '' || juegoTerminado) {
            return;
        }

        celda.textContent = turnoActual;

        if (hayGanador()) {
            mensajeFinal.textContent = `¡Ha ganado ${turnoActual}!`;
            juegoTerminado = true;
            return;
        }

        if (tableroLleno()) {
            mensajeFinal.textContent = 'Empate';
            juegoTerminado = true;
            return;
        }

        turnoActual = turnoActual === 'X' ? 'O' : 'X';
        turnoTexto.textContent = turnoActual;
    });
});

function hayGanador() {
    for (let i = 0; i < combinacionesGanadoras.length; i++) {
        const combinacion = combinacionesGanadoras[i];

        const a = combinacion[0];
        const b = combinacion[1];
        const c = combinacion[2];

        const valorA = celdas[a].textContent;
        const valorB = celdas[b].textContent;
        const valorC = celdas[c].textContent;

        if (valorA !== '' && valorA === valorB && valorB === valorC) {
            return true;
        }
    }
    return false;
}

function tableroLleno() {
    for (let i = 0; i < celdas.length; i++) {
        if (celdas[i].textContent === '') {
            return false;
        }
    }
    return true;
}

btnReiniciar.addEventListener('click', function () {
    for (let i = 0; i < celdas.length; i++) {
        celdas[i].textContent = '';
    }
    turnoActual = 'X';
    juegoTerminado = false;
    turnoTexto.textContent = turnoActual;
    mensajeFinal.textContent = '';
});
