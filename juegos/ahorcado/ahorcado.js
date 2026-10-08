$(document).ready(function () {
    const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';


    function crearTeclado() {
        $('#letras-teclado').html('');

        for (let i = 0; i < LETRAS.length; i++) {
            const letra = LETRAS[i];
            $('#letras-teclado').append(`
                <button type="button" class="btn btn-outline-secondary m-1" data-letra="${letra}">${letra}</button>
            `);
        }
    }

    $('#letras-teclado').on('click', '[data-letra]', function () {
        const letra = $(this).data('letra');
        $(this).prop('disabled', true);

        console.log('Letra pulsada:', letra);
    });


    $('#btn-jugar').on('click', function () {
        const nivel = $('#nivel').val();

        if (nivel === '') {
            $('#nivel').addClass('is-invalid');
            return;
        }

        crearTeclado();
        $('#portada').addClass('d-none');
        $('#juego').removeClass('d-none');
    });

    $('#nivel').on('change', function () {
        $(this).removeClass('is-invalid');
    });
});
