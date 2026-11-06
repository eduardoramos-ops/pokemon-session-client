const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const rl = readline.createInterface({
    input: stdin,
    output: stdout
});
const fs = require("node:fs")
const path = require("node:path")
const ARQUIVO_TOKEN = path.join(__dirname, ".token")

const SERVIDOR = "http://127.0.0.1:5000";

let tokenAcesso = "";

if (fs.existsSync(ARQUIVO_TOKEN)) {
    tokenAcesso = fs.readFileSync(ARQUIVO_TOKEN, "utf8").trim();
}

async function requisicao(caminho, metodo = "GET", corpo = null) {
    try {
        const headers = {};

        if (corpo) {
            headers["Content-Type"] = "application/json";
        }

        if (tokenAcesso) {
            headers.Authorization = `Bearer ${tokenAcesso}`;
        }

        const resposta = await fetch(`${SERVIDOR}${caminho}`, {
            method: metodo,
            headers,
            body: corpo ? JSON.stringify(corpo) : undefined
        });

        const dados = await resposta.json();

        return {
            status: resposta.status,
            dados
        };

    } catch (erro) {
        console.log("Não foi possível conectar ao servidor.");
        return null;
    }
}

async function menu() {
    let opcao;

    do {
        console.log("\n----- POKEMON TOKEN -----");
        console.log("1 - Cadastrar usuário");
        console.log("2 - Fazer login");
        console.log("3 - Consultar Pokémon");
        console.log("4 - Consultar usuário autenticado");
        console.log("5 - Fazer logout");
        console.log("0 - Sair");

        opcao = await rl.question("\nEscolha uma opção: ");

        switch (opcao) {
            case "1": {
                const email = await rl.question("E-mail: ");
                const senha = await rl.question("Senha: ");

                const resultado = await requisicao(
                    "/auth/cadastro",
                    "POST",
                    { email, senha }
                );

                if (resultado) {
                    console.log(resultado.dados);
                }

                break;
            }

            case "2": {
                const email = await rl.question("E-mail: ");
                const senha = await rl.question("Senha: ");

                const resultado = await requisicao(
                    "/auth/login",
                    "POST",
                    { email, senha }
                );

                if (resultado) {
                    console.log(resultado.dados.mensagem);

                    if (resultado.status === 200) {
                        tokenAcesso = resultado.dados.token;
                        fs.writeFileSync(ARQUIVO_TOKEN, tokenAcesso);
                        console.log("Token recebido e armazenado no cliente.");
                    } else {
                        console.log(resultado.dados.erro);
                    }
                }

                break;
            }

            case "3": {
                const nome = await rl.question("Nome do Pokémon: ");

                if (!nome.trim()) {
                    console.log("Digite um nome válido.");
                    break;
                }

                const resultado = await requisicao(
                    `/pokemon/${encodeURIComponent(nome.trim())}`
                );

                if (resultado) {
                    console.log("Status HTTP:", resultado.status);
                    console.log(resultado.dados);
                }

                break;
            }

            case "4": {
                const resultado = await requisicao("/auth/me");

                if (resultado) {
                    console.log("Status HTTP:", resultado.status);
                    console.log(resultado.dados);
                }

                break;
            }

            case "5": {
                const resultado = await requisicao(
                    "/auth/logout",
                    "POST"
                );

                if (resultado) {
                    console.log(resultado.dados);

                    if (resultado.status === 200) {
                        tokenAcesso = "";
                        if (fs.existsSync(ARQUIVO_TOKEN)) {
                            fs.unlinkSync(ARQUIVO_TOKEN);
                        }
                    }
                }

                break;
            }

            case "0":
                console.log("Encerrando o cliente...");
                break;

            default:
                console.log("Opção inválida.");
        }

    } while (opcao !== "0");

    rl.close();
}

menu();
