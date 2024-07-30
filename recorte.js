const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Caminho para o vídeo de entrada
const inputVideoPath = path.join(__dirname, 'input_longo');

// Caminhos para os vídeos temporários e de saída
const trimmedVideoPath = path.join(__dirname, 'input_trim.mp4');
const outputPath1 = path.join(__dirname, 'output_1.mp4');
const outputPath2 = path.join(__dirname, 'output_2.mp4');
const finalOutputPath = path.join(__dirname, 'output_final.mp4');

function trimVideo() {
    ffmpeg(inputVideoPath)
        .setStartTime('313')
        .setDuration('59.5')
        .on('end', () => {
            console.log('Vídeo cortado para 60 segundos.');
            processVideo();
        })
        .on('error', (err) => {
            console.error('Erro ao cortar o vídeo:', err);
        })
        .save(trimmedVideoPath);
}

// Função para processar o vídeo
function processVideo() {
    // Primeiro recorte (primeira pessoa, canto superior esquerdo)
    ffmpeg(trimmedVideoPath)
        .videoFilters([
            'crop=in_w/2:in_h/3*2:0:0',
            'scale=1080:960',
            'pad=1080:960:0:0:black'
        ])
        .on('end', () => {
            console.log('Primeiro clipe processado.');
            processSecondClip();
        })
        .on('error', (err) => {
            console.error('Erro ao processar o primeiro clipe:', err);
        })
        .save(outputPath1);

    // Função para processar o segundo clipe
    function processSecondClip() {
        ffmpeg(trimmedVideoPath)
            .videoFilters([
                'crop=in_w/2:in_h/3*2:in_w/2:0',
                'scale=1080:960',
                'pad=1080:960:0:0:black'
            ])
            .on('end', () => {
                console.log('Segundo clipe processado.');
                combineClips();
            })
            .on('error', (err) => {
                console.error('Erro ao processar o segundo clipe:', err);
            })
            .save(outputPath2);
    }

    // Função para combinar os clipes
    function combineClips() {
        ffmpeg()
            .input(outputPath1)
            .input(outputPath2)
            .complexFilter([
                '[0:v][1:v]vstack=inputs=2'
            ])
            .on('end', () => {
                console.log('Vídeo finalizado.');
            })
            .on('error', (err) => {
                console.error('Erro ao combinar os clipes:', err);
            })
            .save(finalOutputPath);
    }
}

// Chama a função para processar o vídeo
trimVideo();
