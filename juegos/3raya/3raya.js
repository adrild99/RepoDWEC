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
    return combinacionesGanadoras.some(function (combinacion) {
        const [a, b, c] = combinacion;
        const valorA = celdas[a].textContent;
        const valorB = celdas[b].textContent;
        const valorC = celdas[c].textContent;
        return valorA !== '' && valorA === valorB && valorB === valorC;
    });
}

function tableroLleno() {
    return Array.from(celdas).every(function (celda) {
        return celda.textContent !== '';
    });
}

btnReiniciar.addEventListener('click', function () {
    celdas.forEach(function (celda) {
        celda.textContent = '';
    });
    turnoActual = 'X';
    juegoTerminado = false;
    turnoTexto.textContent = turnoActual;
    mensajeFinal.textContent = '';
});
