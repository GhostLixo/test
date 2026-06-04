const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const client = new MongoClient("mongodb://localhost:27017"); // §s Endereço da host do mongo
app.use(express.json()); // ✅ FIX 1 — sem isso req.body fica undefined

async function main() {
  await client.connect();
  const db = client.db("Mine");
  const jogadores = db.collection("jogadores");
  const clans = db.collection("DBclans"); // ✅ FIX 2 — era db.collections() e variável ClanName errada


// Retornar e consulta o nome de todos os clãs
  app.get("/carregarClanNames", async (req, res) => { 
    const teste = await clans.find({}, { projection: { nome: 1, _id: 0 } }).toArray();
    res.json(teste);
  });
  
  app.get("/carregarListaMembros/:doclan", async (req, res) => {
    const {doclan} = req.params;
    const listandoMembros = await clans.findOne( { nome: doclan }, { projection: { ListaMembros: 1, _id: 0}});
    if (!listandoMembros) return res.status(404).json({ Erro: "Clã não encontrado"});
    res.status(200).json(listandoMembros.ListaMembros);
  });



  // §a POST — Cria e Salva o nome do clã e cria a lista membros --> nome: "", ListaMembros: [ ]
  app.post("/SalvarClan", async (req, res) => { //§e  Sempre Verifique se o primeiro parametro é igual ao que você definiu em new httpRequest
    try {
      const { nome, ListaMembros } = req.body;
      if (!nome) return res.status(400).json({ erro: "nome obrigatório" });
      await clans.insertOne({ nome, ListaMembros, criadoEm: Date.now() });
      res.status(200).json({ status: "ok", nome });
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }


  });
  app.post("/adicionarMembro", async (req, res) => {
    try {
        const { nome, ADDmembro } = req.body;
        await clans.updateOne(
            { nome: nome },
            { $push: { ListaMembros: ADDmembro } }
        );
        res.status(200).json({ mensagem: "Membro adicionado!" }); // ← faltava isso!
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

  app.listen(3000, () => console.log("✅ API rodando na porta 3000"));
}

main();




function dataAtual() {
  const data = Date();
  const Ano = new Date(data).getFullYear();
  const Mes = new Date(data).getMonth() + 1;
  const Dia = new Date(data).getDate();
  const MostrarData = `${Dia}/${Mes}/${Ano}`;
  return MostrarData;
}

