const { Command } = require("commander");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

class CliProgram {
    prog;

    constructor() {
        this.prog = new Command();
        this.prog.name("kaholo-cli").description("CLI for interacting with your Kaholo environment").version("0.1.0");
    }

    loadActions(){
        const actionsDirPath = path.join(__dirname,'./actions')
        const files = fs.readdirSync(actionsDirPath);
        files.forEach(file=>{
            require(`${actionsDirPath}/${file}`).load(this);
        });
    }

    start() {
        try {
            this.prog.parse();
        } catch (err) {
            console.error(err);
        }
    }

    success(message) {
        this.prog.error(chalk.green.bold(message));
    }

    warning(message) {
        this.prog.error(chalk.yellow.bold(message));
    }

    exitWithMessage(err, options= {
      chalk: chalk.red,
      exitCode: 1
    }) {
        this.prog.error(options.chalk.bold(err));
        process.exit(options.exitCode);
    }
}

const cli = new CliProgram();
module.exports = cli;
cli.loadActions();
