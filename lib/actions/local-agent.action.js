const { execSync, exec } = require('child_process');
const { existsSync } = require('fs');
const ngrok = require('ngrok');
const path = require('path');

const defaultClonePath = path.join(process.cwd(),`tmp/kaholo-agent-${new Date().getTime()}`)
const defaultCertsPath = path.join(process.cwd(),`kaholo-agent-certs`)

class LocalAgentAction {
    load(cli) {
        cli.prog
            .command("local-agent")
            .description(`Clones the agent and starts it proxied by a ngrok tunnel.
By default the agent is cloned to <WORKING_DIRECTORY>/kaholo-agent-<Timestamp>. 
(Currently: ${defaultClonePath})`)
            .argument('[url]', 'The URL of the kaholo platform to connect to')
            .option('--certs-path <string>', `The path to the directory contains the certificates. Default: <working_direcotry>/tmp/kaholo-agent-certs (Currently: ${defaultCertsPath})`)
            .option('-p, --port <string>', 'The local agent port. Default is 8090')
            .option('--clone-path <string>', `The path the agent will be cloned to. Default is <working_direcotry>/tmp/kaholo-agent-<timestamp> (Currently: ${defaultClonePath})`)
            .option('-ak, --agent-key <string>', `The agent key. Default is 'local-cli-agent-[port]'`)
            .action(async (url, {certsPath, port, agentKey, clonePath}) => {
                let usedPort = 8090;
                if (port){
                    const parsedPort = Number(port);
                    if (isNaN(Number(port))){
                        return cli.exitWithMessage(`Port '${port}' is not a valid number.`);
                    }
                    usedPort = parsedPort;
                }
                const finalClonePath = this.parseClonePath(clonePath)
                this.run({ 
                    kaholoUrl: url, 
                    clonePath: finalClonePath,
                    port: usedPort, 
                    agentKey: agentKey || `local-cli-agent-${usedPort}`, 
                    certsPath: this.parseRelativeCertsPath(certsPath, finalClonePath)
                });
            });
    }

    async run({ kaholoUrl, port, agentKey, certsPath, clonePath }) {
        
        const parsedUrl = new URL(kaholoUrl);
        
        if (existsSync(clonePath)){
            this.pullChanges(clonePath);
        } else {
            this.cloneRepo(clonePath);
        }
        
        console.log(`Installing dependencies`)
        execSync(`npm install --production`, {cwd: clonePath, stdio: 'inherit'});
        
        console.log(`Starting ngrok tunnel...`)
        let tunnelUrl;
        try{
            const addr= `http://localhost:${port}`;
            tunnelUrl = await ngrok.connect({
                proto: "http",
                addr,
                onLogEvent: (log) =>{
                    // console.info(`[ngrok] ${log}`);
                }
            });
            console.log(`ngrok tunnel to ${addr} opened at: ${tunnelUrl}`);
            console.log("Open the ngrok dashboard at: http://localhost:4040\n");
        } catch (err){
            console.error("Error opening ngrok tunnel: ", err);
            process.exit(1);
        }
        
        const agentProcess = exec(`npm start`, {
                cwd: clonePath,
                // cwd: clonePath, 
                stdio: 'inherit',
                env:{
                    ...process.env,
                    URL: tunnelUrl,
                    PORT: port,
                    AGENT_KEY: agentKey,
                    SERVER_URL: kaholoUrl,
                    AMQP_HOST: parsedUrl.host,
                    AMQP_PORT: 5671,
                    AMQP_USER: 'twiddlebugs',
                    AMQP_PASSWORD:'twiddlebugs',
                    AMQP_RESULT_QUEUE:'actions-outcome',
                    AMQP_CERT_PATH:`./${certsPath}/client_certificate.crt`,
                    AMQP_KEY_PATH:`./${certsPath}/client_key.pem`
                }
        });

        agentProcess.stdout.pipe(process.stdout);
        agentProcess.on('exit',(code,signal)=>{
            process.exit(code);
        })
    }

    parseClonePath(inputClonePath){
        if(!inputClonePath) return defaultClonePath;
        return path.isAbsolute(inputClonePath) ? inputClonePath : path.join(process.cwd(),inputClonePath);
    }

    parseRelativeCertsPath(inputCertsPath, clonePath){
        if(!inputCertsPath)
            return defaultCertsPath;
        const absPath = path.isAbsolute(inputCertsPath) ? inputCertsPath : path.join(process.cwd(),inputCertsPath);
        return path.relative(path.join(clonePath,'..'),absPath);
    }

    cloneRepo(clonePath){
        console.log(`Cloning kaholo agent into '${clonePath}'`)
        execSync(`git clone https://github.com/Kaholo/kaholo-agent.git ${clonePath}`, {stdio: 'inherit'});
    }

    pullChanges(clonePath){
        console.log(`Pulling changes in '${clonePath}'`)
        execSync(`git pull`, {stdio: 'inherit', cwd: clonePath});
    }
}

module.exports = new LocalAgentAction();
