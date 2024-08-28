const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const crypto = require('crypto');
const FormData = require('form-data'); 
const axios = require('axios');
const path = require('path');


module.exports = async function legendaUploadFile(req, res) {
    const videoPath = req.file.path;
    //const videoPath = 'uploads/6972a0d9ec177155da436b29e90c200b'
    const audioPath = `${videoPath}.mp3`;
  
    try {
      // Extrair áudio do vídeo
      await extractAudio(videoPath, audioPath);
  
  
      // Dividir o áudio em segmentos de 20 minutos com overlap de 10 segundos
      const segments = await splitAudioWithOverlap(audioPath);
      //const segments = ['uploads/6972a0d9ec177155da436b29e90c200b-0.mp3',
      //                  'uploads/6972a0d9ec177155da436b29e90c200b-1.mp3',
      //                  'uploads/6972a0d9ec177155da436b29e90c200b-2.mp3',
      //                  'uploads/6972a0d9ec177155da436b29e90c200b-3.mp3',
      //                ]
  
  
      // Enviar cada segmento para a API Whisper e obter transcrições
      //const segmentsTranscriptions = [];
      //for (const segment of segments) {
      //  const transcriptions = await transcribeSegment(segment);
      //  segmentsTranscriptions.push(transcriptions);
      //}
  
      // Combinar as transcrições removendo o overlap
      //const combinedTranscriptions = combineTranscriptions(segmentsTranscriptions);
  
      // Gerar legendas no formato ASS
      //const subtitles = generateSubtitlesFromSegments(combinedTranscriptions);
  
  
      // Salvar legendas em um arquivo ASS
      const subtitlesPath = `${videoPath}.ass`;
      await saveSubtitlesToFile(subtitles, subtitlesPath);
  
      //// Salvar legendas em um arquivo SRT
      //const subtitlesPath = `${videoPath}.srt`;
      //await saveSubtitlesToFile(subtitles, subtitlesPath);
  
      // Anexar legendas ao vídeo
      const finalVideoPath = `${videoPath}-with-subtitles.mp4`;
      await attachSubtitles(videoPath, subtitlesPath, finalVideoPath);
  
      res.download(finalVideoPath);
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao processar o vídeo');
    } finally {
      // Limpar arquivos temporários
      fs.unlink(videoPath, () => {});
      fs.unlink(audioPath, () => {});
    }
  }
  
  function extractAudio(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
  
  async function generateSubtitles(audioPath) {
    const apiKey = process.env.OPENAI_API_KEY;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json'); // Request detailed segments
  
  
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'multipart/form-data',
          ...formData.getHeaders(),
        },
      }
    );
  
    const segments = response.data.segments;
    let subtitles = '';
  
    subtitles += `[Script Info]\n`;
    subtitles += `ScriptType: v4.00+\n`;
    subtitles += `PlayDepth: 0\n\n`;
    subtitles += `[V4+ Styles]\n`;
    subtitles += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
    subtitles += `Style: Default,Ubuntu,14,&H0000FFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0.00,1,1.00,0.00,2,10,10,10,1\n\n`;
    subtitles += `[Events]\n`;
    subtitles += `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  
  
    segments.forEach((segment, index) => {
      const startTime = segment.start || 0;
      const endTime = segment.end || startTime + 1;
      const text = segment.text;
  
      subtitles += `Dialogue: 0,${formatTime(startTime)},${formatTime(endTime)},Default,,0,0,0,,${text}\n`;
  
      //    subtitles += `${index + 1}\n`;
      //    subtitles += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      //    subtitles += `${text}\n\n`;
    });
    return subtitles;
  }
  
  function saveSubtitlesToFile(subtitles, filePath) {
    return fs.promises.writeFile(filePath, subtitles);
  }
  
  function attachSubtitles(videoPath, subtitlesPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions('-vf', `subtitles=${subtitlesPath}`)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
  
  function splitAudioWithOverlap(audioPath, segmentDuration = 1200, overlapDuration = 10) {
    return new Promise((resolve, reject) => {
      const segmentFiles = [];
      let startTime = 0;
      let segmentIndex = 0;
  
      const segmentAudio = () => {
        const outputSegmentPath = path.join(path.dirname(audioPath), path.basename(audioPath, '.mp3') + `-${segmentIndex}.mp3`);
        segmentFiles.push(outputSegmentPath);
  
        ffmpeg(audioPath)
          .setStartTime(startTime)
          .setDuration(segmentDuration + overlapDuration)
          .output(outputSegmentPath)
          .on('end', () => {
            startTime += segmentDuration; // Move startTime by segmentDuration to create overlap
            segmentIndex++;
            if (startTime < totalDuration) {
              segmentAudio();
            } else {
              resolve(segmentFiles);
            }
          })
          .on('error', reject)
          .run();
      };
  
      // Get the total duration of the audio file
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) reject(err);
        totalDuration = metadata.format.duration;
        segmentAudio();
      });
    });
  }
  
  
  function splitAudio(audioPath, segmentDuration = 1200, overlapDuration = 10) {
    return new Promise((resolve, reject) => {
      const outputPattern = path.join(path.dirname(audioPath), path.basename(audioPath, '.mp3') + '-%03d.mp3');
      ffmpeg(audioPath)
        .outputOptions([
          '-f', 'segment',
          `-segment_time`, segmentDuration,
          `-segment_time_delta`, overlapDuration,
          '-reset_timestamps', '1',
          '-c', 'copy'
        ])
        .output(outputPattern)
        .on('end', () => {
          // List the generated segments
          const segmentDir = path.dirname(audioPath);
          fs.readdir(segmentDir, (err, files) => {
            if (err) reject(err);
            const segmentFiles = files.filter(file => file.startsWith(path.basename(audioPath, '.mp3') + '-') && file.endsWith('.mp3'));
            resolve(segmentFiles.map(file => path.join(segmentDir, file)));
          });
        })
        .on('error', reject)
        .run();
    });
  }
  
  async function transcribeSegment(segmentPath) {
    const savedResponseData = loadObjectWithHash(segmentPath);
    if (savedResponseData != null) return savedResponseData.segments;
  
    const apiKey = process.env.OPENAI_API_KEY;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(segmentPath));
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json'); // Request detailed segments
  
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders(), // Adiciona os cabeçalhos do form-data
        },
      }
    );
    const res = response.data;
    saveObjectWithHash(segmentPath, res);
    return res.segments;
  }
  
  
  function combineTranscriptions(segmentsTranscriptions, segmentDuration = 1200, overlapDuration = 10) {
    let combinedTranscriptions = [];
    const endOfSentence = /.*\w\.$/;
    let nextEnd = 0;
  
    segmentsTranscriptions.forEach((segments, segmentIndex) => {
      let timeShift = segmentIndex * segmentDuration;
      let segmentEnd = timeShift + segmentDuration;
      let segmentBegin = timeShift + overlapDuration;
      segments.forEach(segment => {
        segment.start += timeShift;
        segment.end += timeShift;
      });
      let isEndOfSentence = false;
      segments.forEach(segment => {
  
        //no inicio o segmento pode ser que de um erro de ms já incluido
        if (segment.end < segmentBegin) {
          if (-1 < nextEnd - segment.end && nextEnd - segment.end < 1) nextEnd = segment.end;
        }
  
        //inclui todos os segmentos que são depois do arquivo pre existente
        if (segment.end < segmentBegin && (nextEnd < segment.end)) {
          combinedTranscriptions.push(segment);
        }
        //o segmento é exclusivo deste trecho
        if (segment.start < segmentEnd && segmentBegin < segment.end) {
          combinedTranscriptions.push(segment);
          nextEnd = segment.end;
        }
  
        //o segmento esta antes do fim até aṕos o fim já entrou mas pode ser o ultimo
        if (segment.start < segmentEnd && segmentEnd < segment.end) {
          isEndOfSentence = endOfSentence.test(segment.text);
        }
  
        //o segmento esta depois do fim mas não teve final de sentença ainda
        if (segmentEnd < segment.start && !isEndOfSentence) {
          combinedTranscriptions.push(segment);
          nextEnd = segment.end;
          isEndOfSentence = endOfSentence.test(segment.text);
        }
      });
    });
  
    return combinedTranscriptions;
  }
  
  function generateSubtitlesFromSegments(segments) {
    let subtitles = '';
  
    subtitles += `[Script Info]\n`;
    subtitles += `ScriptType: v4.00+\n`;
    subtitles += `PlayDepth: 0\n\n`;
    subtitles += `[V4+ Styles]\n`;
    subtitles += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
    subtitles += `Style: Default,Ubuntu,14,&H0000FFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0.00,1,1.00,0.00,2,10,10,10,1\n\n`;
    subtitles += `[Events]\n`;
    subtitles += `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  
    segments.forEach((segment, index) => {
      const startTime = segment.start || 0;
      const endTime = segment.end || startTime + 1;
      const text = segment.text;
  
      subtitles += `Dialogue: 0,${formatTime(startTime)},${formatTime(endTime)},Default,,0,0,0,,${text}\n`;
    });
  
    return subtitles;
  }
  
  function formatTime(seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8) + ',000';
  }
  
  function saveObjectWithHash(filePath, obj) {
    // Ler o conteúdo do arquivo
    const data = fs.readFileSync(filePath)
  
    // Calcular o hash (SHA-256) do conteúdo do arquivo
    const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  
    // Criar o nome do arquivo com o hash e a extensão .json
    const fileName = `${hash}.json`;
  
    // Converter o objeto para string JSON
    const jsonString = JSON.stringify(obj);
  
    // Salvar o objeto no arquivo
    fs.writeFileSync(path.join(path.dirname(filePath),fileName),jsonString,'utf-8')
  }
  
  function loadObjectWithHash(filePath) {
    // Ler o conteúdo do arquivo
    const data = fs.readFileSync(filePath)
  
    // Calcular o hash (SHA-256) do conteúdo do arquivo
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    // Criar o nome do arquivo com o hash e a extensão .json
    const fileName = `${hash}.json`;
  
    // le o objeto no arquivo
    let conteudo
    try {
      conteudo = fs.readFileSync(path.join(path.dirname(filePath),fileName), "utf-8");    
    } catch (error) {
      console.log('Não foi encontrado arquivo: ',error)
      return
    }
  
    // Converter o objeto para string JSON
    const jsonObj = JSON.parse(conteudo);
    return jsonObj
  }
  
  