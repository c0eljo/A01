// Arquivo: app.js
const express = require('express');
const Web3 = require('web3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configuração básica
const app = express();
const web3 = new Web3('https://mainnet.infura.io/v3/SEU_INFURA_API_KEY'); // Ou sua própria node

// Configuração do contrato inteligente (ABI e endereço)
const contractABI = [/* ABI do seu contrato */];
const contractAddress = '0x...'; // Endereço do seu contrato implantado
const artContract = new web3.eth.Contract(contractABI, contractAddress);

// Configuração do upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware para verificar autenticação do artista
function authenticateArtist(req, res, next) {
  // Implemente sua lógica de autenticação aqui
  next();
}

// Rota para upload de arte
app.post('/upload-art', authenticateArtist, upload.single('artFile'), async (req, res) => {
  try {
    const { originalname, mimetype, size, path: filePath } = req.file;
    const { title, description, isExclusive } = req.body;
    const artistAddress = req.user.blockchainAddress; // Supondo que o usuário está autenticado

    // Calcular hash do arquivo para identificação única
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Registrar arte na blockchain
    const tx = await artContract.methods.registerArt(
      fileHash,
      artistAddress,
      title,
      isExclusive === 'true'
    ).send({ from: artistAddress });

    // Salvar metadados no banco de dados (simplificado)
    const artMetadata = {
      fileHash,
      artistAddress,
      title,
      description,
      filePath,
      mimetype,
      size,
      isExclusive: isExclusive === 'true',
      txHash: tx.transactionHash,
      timestamp: new Date()
    };

    // Aqui você salvaria no seu banco de dados real
    console.log('Arte registrada:', artMetadata);

    res.status(201).json({
      success: true,
      message: 'Arte registrada com sucesso na blockchain!',
      data: artMetadata
    });
  } catch (error) {
    console.error('Erro ao registrar arte:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar arte' });
  }
});

// Rota para verificar autoria
app.get('/verify-art/:fileHash', async (req, res) => {
  try {
    const { fileHash } = req.params;

    // Verificar na blockchain
    const artInfo = await artContract.methods.getArtInfo(fileHash).call();

    if (!artInfo.artist || artInfo.artist === '0x0000000000000000000000000000000000000000') {
      return res.json({ isRegistered: false });
    }

    res.json({
      isRegistered: true,
      artist: artInfo.artist,
      title: artInfo.title,
      isExclusive: artInfo.isExclusive,
      registrationDate: new Date(parseInt(artInfo.timestamp) * 1000)
    });
  } catch (error) {
    console.error('Erro ao verificar arte:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar arte' });
  }
});

// Rota para compartilhar/republish arte
app.post('/share-art/:fileHash', authenticateArtist, async (req, res) => {
  try {
    const { fileHash } = req.params;
    const { originalArtistAddress, sharePlatform } = req.body;
    const sharerAddress = req.user.blockchainAddress;

    // Verificar se a arte existe
    const artInfo = await artContract.methods.getArtInfo(fileHash).call();
    
    if (!artInfo.artist || artInfo.artist === '0x0000000000000000000000000000000000000000') {
      return res.status(404).json({ success: false, message: 'Arte não encontrada' });
    }

    // Registrar compartilhamento na blockchain
    const tx = await artContract.methods.registerShare(
      fileHash,
      originalArtistAddress,
      sharerAddress,
      sharePlatform
    ).send({ from: sharerAddress });

    res.json({
      success: true,
      message: 'Compartilhamento registrado com sucesso!',
      txHash: tx.transactionHash
    });
  } catch (error) {
    console.error('Erro ao registrar compartilhamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar compartilhamento' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});