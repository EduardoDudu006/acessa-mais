const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors()); // Permite que o Frontend hospedado na Vercel se comunique com a API no Render

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Configuração do Swagger
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API REST - ACESSA+",
            version: "1.0.0",
            description:
                "Documentação da API de mobilidade urbana e acessibilidade de Recife-PE",
        },
        servers: [
            {
                url: "https://seu-servico-no-render.onrender.com/api",
                description: "Servidor de Produção (Render)",
            },
        ],
    },
    apis: ["./server.js"],
};

const specs = swaggerJsdoc(options);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

// Conexão com o Banco de Dados PostgreSQL (Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Inicializar tabela de usuários
pool.query(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    pontos INT DEFAULT 320
  );
`).catch(err => console.error('Erro ao criar tabela:', err));

// Rota de Cadastro Real
app.post('/api/register', async (req, res) => {
  const { email, senha, nome } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    const novoUsuario = await pool.query(
      'INSERT INTO usuarios (email, senha, nome) VALUES ($1, $2, $3) RETURNING id, email, nome, pontos',
      [email, hashedPassword, nome || 'Colaborador Acessa+']
    );
    res.status(201).json({ mensagem: 'Conta criada com sucesso!', usuario: novoUsuario.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    } else {
      res.status(500).json({ erro: 'Erro no servidor.', detalhes: err.message });
    }
  }
});

// Rota de Login Real
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail não encontrado. Faça o cadastro.' });
    }

    const usuario = resultado.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    res.json({
      mensagem: 'Login realizado com sucesso!',
      usuario: { id: usuario.id, email: usuario.email, nome: usuario.nome, pontos: usuario.pontos }
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao processar login.', detalhes: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
