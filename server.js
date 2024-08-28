const express = require('express');
const multer = require('multer');
const legendaUploadFile = require('./legenda.js');

require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env


const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public')); // Pasta para arquivos estáticos (HTML, CSS, etc.)

app.post('/upload', upload.single('video'), legendaUploadFile);

app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
});

