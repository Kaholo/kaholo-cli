const inquirer = require("inquirer");
const kaholoService = require("../services/kaholo.service");
const cli = require("../cli");

class SwitchProfileAction {
    load(cli) {
        cli.prog
            .command("current-profile")
            .description("Print out the current used profile")
            .action(async ({ profile }) => {
                console.log(`Current profile: '${kaholoService.currentProfile}'`);
            });
    }
}

module.exports = new SwitchProfileAction();
