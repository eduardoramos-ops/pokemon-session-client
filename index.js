const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const rl = readline.createInterface({
    input: stdin,
    output: stdout
});

const SERVIDOR = "http://192.168.3.175:3000";

let cookieSessao = "";

async function consultarServidor(caminho, metodo = "GET", corpo = null) {
    try {
        const headers = {};

        if (corpo) {
            headers["Content-Type"] = "application/json";
        }

        // Reenvia o cookie nas próximas requisições.
        if (cookieSessao) {
            headers.Cookie = cookieSessao;
        }

        const resposta = await fetch(`${SERVIDOR}${caminho}`, {
            method: metodo,
            headers,
            body: corpo ? JSON.stringify(corpo) : undefined
        });

        // Captura o cookie enviado pelo servidor.
        const cookies = resposta.headers.getSetCookie();

        if (cookies.length > 0) {
            cookieSessao = cookies
                .map(cookie => cookie.split(";")[0])
                .join("; ");
        }

        const dados = await resposta.json();

        console.log(`\nStatus HTTP: ${resposta.status}`);
        console.log("Resposta do servidor:");
        console.log(dados);

        return resposta.status;

    } catch (erro) {
        console.log("\nNão foi possível conectar ao servidor.");
        console.log("Verifique se ele está em execução.");

        return null;
    }
}

async function menu() {
    let opcao;

    do {
        console.log("\n=== POKEMON SESSION ===");
        console.log("1 - Verificar servidor");
        console.log("2 - Cadastrar usuário");
        console.log("3 - Fazer login");
        console.log("4 - Consultar Pokémon");
        console.log("5 - Fazer logout");
        console.log("0 - Sair");

        opcao = await rl.question("\nEscolha uma opção: ");

        switch (opcao) {
            case "1":
                await consultarServidor("/health");
                break;

            case "2": {
                const email = await rl.question("E-mail: ");
                const senha = await rl.question("Senha: ");

                await consultarServidor(
                    "/auth/cadastro",
                    "POST",
                    { email, senha }
                );

                break;
            }

            case "3": {
                const email = await rl.question("E-mail: ");
                const senha = await rl.question("Senha: ");

                await consultarServidor(
                    "/auth/login",
                    "POST",
                    { email, senha }
                );

                break;
            }

            case "4": {
                const nome = await rl.question("Nome do Pokémon: ");

                if (!nome.trim()) {
                    console.log("Digite um nome válido.");
                    break;
                }

                await consultarServidor(
                    `/pokemon/${encodeURIComponent(nome.trim())}`
                );

                break;
            }

            case "5": {
                const status = await consultarServidor(
                    "/auth/logout",
                    "POST"
                );

                if (status === 200) {
                    cookieSessao = "";
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

