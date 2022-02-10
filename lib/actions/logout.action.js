const kaholoService = require("../services/kaholo.service");

class LogoutAction {
    load(cli){
        cli.prog
            .command("logout")
            .description("Cleans all credentials")
            .action(async () => {
                this.run();
            });
    }

    async run() {
        return kaholoService.logout();
    }
}

module.exports = new LogoutAction();
