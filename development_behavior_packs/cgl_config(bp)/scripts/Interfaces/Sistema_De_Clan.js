import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { system, world, TicksPerSecond } from "@minecraft/server";
import { http, HttpRequest, HttpRequestMethod, HttpHeader } from "@minecraft/server-net"


export let arrayclan = [];    // Nomes dos clãs
export let TextoBilhete = []; // Bilhete que o jogador deixa
export let arrayMembros = []; // Array dos membros de cada clã
export let ClaName = "vaise";
export let arrayClanRegras = [];


export function formcriaclan(player) {
    const formCreateClan = new ModalFormData()
        formCreateClan
        .title("Criar Clã")
        .textField("Preencha os campos abaixo para criar seu clã\n\nNome do Clã", "Digite o nome do seu clan")
        .show(player)
        .then((response) => { if (response.canceled) return;
            
            const clanName = response.formValues[0]?.trim() + "§f";
            
            if (!clanName || clanName.length > 24){
                player.sendMessage("Nome do Clã §cInvalido! "); return;
            }

            DBsalvarClan(clanName, player.name).then(res => { // Parametros (Recebe o nome do clã inse - Recebe o nome do player)
                if (res.status === 200) {
                    console.log(`Clã ${clanName} salvo no banco de dados!`);
                    player.addTag('clan_' + clanName);
                    player.setDynamicProperty("nivelClan", 3);//nivel 3 para lider do clan
                    player.setDynamicProperty("doclan", clanName);
                    player.sendMessage(`Você criou o CLÃ --> ${clanName}`);
                }   
                else { player.sendMessage(`§cErro ao Criar o clã!`); console.log(`Erro ao Criar o clã: ${res.status}`); return; }
            });
        });
} 
function DBsalvarClan(clanName, Nome_do_criador) {
  const request = new HttpRequest("http://localhost:3000/SalvarClan");
  request.method = HttpRequestMethod.Post;
  request.body = JSON.stringify({ Nome: clanName, ListaMembros: Nome_do_criador });
  request.headers = [new HttpHeader("Content-Type", "application/json")];
  return http.request(request);
}
export async function DBCarregarClansName(){ // Retorna array do nome de todos os clãs
    const requisitar = new HttpRequest("http://localhost:3000/carregarClanNames");
    requisitar.method = HttpRequestMethod.Get;

    const resposta = await http.request(requisitar);
    if (resposta.status === 200){
        const dados = JSON.parse(resposta.body);      // [ { nome: "ClanA" }, { nome: "ClanB" } ]
        arrayclan = dados.map(clan => clan.nome);
        console.warn("FUNCAO  DBCarregarClansName() carregando lista de clans ");
    }
    else{
        console.log("Erro ao buscar dados [dbcarregarclanname]: " + resposta.status);
    }    
}
export async function DBCarregarListaMembros(doclan){ // Retorna array dos membros do clã, a função foi chamada em uiMain no itemUse
    const requisitar = new HttpRequest(`http://localhost:3000/carregarListaMembros/${doclan}`);
    requisitar.method = HttpRequestMethod.Get;

    const resposta = await http.request(requisitar);
    if (resposta.status === 200){
              // [ { nome: "ClanA" }, { nome: "ClanB" } ]
        arrayMembros = JSON.parse(resposta.body);
        console.log("Consulta == " + JSON.parse(resposta.body));
        console.log("Consulta == " + typeof(JSON.parse(resposta.body)));
    }
    else{
        console.log("Erro ao buscar dados [dbcarregarListaMembros]: " + resposta.status);
    }    
}
function DbAdcionarMembro(Player_Convidado, entrou_no_clanName){
    
    const requisitar = new HttpRequest("http://localhost:3000/adicionarMembro");
    requisitar.method = HttpRequestMethod.Post;
    requisitar.body = JSON.stringify({ recebeu_ClanNome: entrou_no_clanName, recebeu_MembroConvidado: Player_Convidado });
    requisitar.headers = [new HttpHeader("Content-Type", "application/json")];
    return http.request(requisitar);
}
export function form_MostrarRegras (player,clanTextoRegras){
    const formRegras = new MessageFormData();
    formRegras.title("Regras do Clã");
    formRegras.body(clanTextoRegras);
    formRegras.button1("Entendido");
    formRegras.show(player).then((response) => {
        if (response.canceled || response.selection != 0) return;
    });
}
export function form_definirouVerRegras(player){
    const formLiderRegras = new ActionFormData();
    formLiderRegras.title("Editar ou Vizualizar Regras");
    formLiderRegras.button("Editar Regras");
    formLiderRegras.button("Vizualizar Regras");
    formLiderRegras.show(player).then((response) => {
        if (response.canceled) return;
        
    });
}



export function formmeuclan(player) {// Formulario UI 
} // falta fazer


export function DeixarBilhete(player){
    const formDeixarBilhete = new ModalFormData();
    formDeixarBilhete.title("Deixando um recado");
    formDeixarBilhete.textField("\n\nDeixe um bilhete para os seus membros", "Escreva aqui");
    formDeixarBilhete.show(player).then((response) => {
        if (response.canceled) {return;}
        else {
            const obilhete = response.formValues[0];
            let concatenar = {clanName: player.getDynamicProperty("doclan"), recado: obilhete};
            TextoBilhete.push(concatenar);
        }
    });
}
export function form_VerBilhete(player, bilhete){
    const formVerbilhete = new MessageFormData();
    formVerbilhete.title("Bilhetes dos Superiores");
    formVerbilhete.body(bilhete);
    formVerbilhete.button1("Entendido");
    formVerbilhete.show(player).then((response) => {
        if (response.canceled) {return;}
    });
}




export function formconvitarMembro(player) { // Primeiro passo convidar
    
    const playerscivil = world.getAllPlayers().filter((p) => p.getDynamicProperty("doclan") !== player.getDynamicProperty("doclan"))
    if ( playerscivil.length == 0){ player.sendMessage("§cNão há civil para convidar"); return; }

    const formConvidarMembro = new ModalFormData()
        .title("Convidar Membro")
        .dropdown("  Selecione um jogador para convidar\n\n\n", playerscivil.map(p => p.name))// Retorna os nomes de todos os civis
        .show(player)
        .then((response) => {
            if (response.canceled) return; 
            const jogadorSelecionado = playerscivil[response.formValues];
            jogadorSelecionado.setDynamicProperty("temconvite?", true);
            console.log("string " + jogadorSelecionado.name + "Tem convite: " + jogadorSelecionado.getDynamicProperty("temconvite?"))
            // console.log("teste " + JSON.stringify(jogadorSelecionado));
            // console.log("teste " + JSON.stringify(response.formValues));
            
            
            Mostrarconvite(jogadorSelecionado, player.getDynamicProperty("doclan"), player );
            
            //targetPlayer.addTag(`convite_clan_${player.getTags().find(tag => tag.startsWith("clan_"))}`)
            player.sendMessage(`Você convidou ${jogadorSelecionado.name} para o seu clã` );
            system.runTimeout(() => {
                jogadorSelecionado.setDynamicProperty("temconvite?", false);
                console.log("Covnite mudou para falso " + jogadorSelecionado.getDynamicProperty("temconvite?"));
            }, 20 * TicksPerSecond);
            

            //aqui vai a logica para convidar o l x
            //  jogador para o clan, como verificar se o jogador existe, se ele tem clan, enviar a mensagem de convite, etc
            
            
        })
} //feito mas nao testado
function Mostrarconvite(JogadorConvidado, doclan, lider){
    console.log("Jogador convidado ", JogadorConvidado.name );
    const form_convite = new MessageFormData();
    form_convite.title("Você foi convidado para participar de um clã!!!");
    form_convite.body(`${lider.name} convidou você para participar do clã: ${doclan}`);
    form_convite.button1("Aceitar convite");
    form_convite.button2("Recusar convite");
    form_convite.show(JogadorConvidado).then((response) => {
        if (response.canceled){ console.warn("Cancelado");return;} 
    
        switch (response.selection){
            case 0:
                console.warn("Caso 1 Aceitar");
                console.warn("Caso 1 test", JogadorConvidado.name);
                DbAdcionarMembro(JogadorConvidado.name, doclan).then(res => {
                    if (res.status === 200) {
                        JogadorConvidado.setDynamicProperty("doclan", doclan);
                        JogadorConvidado.setDynamicProperty("nivelClan", 1);
                        JogadorConvidado.sendMessage("Parabens! Você agora faz parte do clã --> " + doclan);
                        console.log("Membro convidado e Salvo no banco de dados");
                    }
                    else {
                        console.log("db " ,  JogadorConvidado.name, " ", res.status); 
                }});
            break;

            case 1:
                console.warn("Caso 2 recusar");
                lider.sendMessage(JogadorConvidado.name + " §cRecusou o convite");
            break;
        }
    });
}



export function MostrarClans(player, Array_CLans_nomes){// §a Finalizado
    const formClanList = new ActionFormData();
    let texto = "";
    for (const x in Array_CLans_nomes){
        texto = texto + `---> ${Array_CLans_nomes[x]}\n`
    }
    formClanList.title("Clãs Existentes");
    formClanList.body(`Veja a Lista dos Clãs existentes:\n${texto}`);
    formClanList.show(player).then((response) => {
        if (response.canceled) return;})
}



export function form_ListarMembros(player, arraymembros) {
    let texto = "";
    const formMembrosList = new ActionFormData();
    
    formMembrosList.title("Lista de Membros");
    if (arrayMembros.length == 0 || arrayMembros == undefined){
        player.sendMessage("Não há membros no momento");
        return;
    }
    else { 
        for (const x in arraymembros){
        texto = texto + `---> ${arraymembros[x]}\n`;
    }  
    }
    console.log(arrayMembros[0]);
    formMembrosList.body(`Veja a Lista dos Membros do clã:\n\n${texto}`);
    formMembrosList.show(player).then((response) => {
        if (response.canceled) return;});
}
 // falta fazer

export function form_expulsarMembro(player) {
    const Membrosdocla = world.getAllPlayers().filter((p) => p.getDynamicProperty("doclan") == player.getDynamicProperty("doclan"));
    //if ( Membrosdocla.length == 1){ player.sendMessage("§cSó tem você online no clã, aguarde o jogador entrar"); return; }
    const expulsarMembro = new ModalFormData()
        .title("Expulsar um Membro do clã")
        .dropdown("  Selecione um jogador para Expulsar\n\n\n", Membrosdocla.map(p => p.name))// Retorna os nomes de todos os civis
        .show(player)
        .then((response) => {
            if (response.canceled) return; 
            const jogadorSelecionado = Membrosdocla[response.formValues];
            
            //DBexpulsarMembro(jogadorSelecionado, player.getDynamicProperty("doclan"));
            // console.log("teste " + JSON.stringify(jogadorSelecionado));
            // console.log("teste " + JSON.stringify(response.formValues));
            
            
            //targetPlayer.addTag(`convite_clan_${player.getTags().find(tag => tag.startsWith("clan_"))}`)
            player.sendMessage(`Você expulsou ${jogadorSelecionado.name} do seu clã` );
            
        });
} // falta fazer
function DBexpulsarMembro(playerExpulso, doclan){
    const requisitar = new HttpRequest ('');
    requisitar.method = HttpRequestMethod.DELETE;


}
export function form_promovermembro(player) {
    const Membrosdocla = world.getAllPlayers().filter((p) => p.getDynamicProperty("doclan") == player.getDynamicProperty("doclan"));
    if ( Membrosdocla.length == 1){ player.sendMessage("§cSó tem você no Clã, convide mais jogadores"); return; }
    const form_promovermembro = new ModalFormData()
        .title("Promover um Membro do clã");
        
} // falta fazer

export function form_rebaixarmembro(player, membro) {

} // falta fazer



export function form_sairclan(player) { // Função 100% pronta e funcional
    const formSairClan = new ModalFormData();
    formSairClan.title("Sair do Clã");
    formSairClan.textField("\n\nVocê realmente Deseja sair do clã?", "Digite a palavra chave --> CONFIRMAR");
    formSairClan.show(player).then((response) => {
        if (response.canceled) return;
        else{
            if (response.formValues[0] == "CONFIRMAR"){
                player.runCommand('tag @s remove clan_' + player.getDynamicProperty("doclan"));
                player.setDynamicProperty("doclan", "civil");
                player.setDynamicProperty("nivelClan", 0);
                
                player.sendMessage("§eAgora você já não faz parte de nenhum Clã!!!");
            }
        }
    });
}


