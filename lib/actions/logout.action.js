const kaholoService = require("../services/kaholo.service");

class LogoutAction {
    load(cli){
        cli.prog
            .command("logout")
            .description("Cleans credentials for a profile")
            .option("-p, --profile <string>", "The profile to save the credentials under. If not provided will use current profile")
            .action(async ({profile}) => {
                this.run({profile});
            });
    }

    async run({profile}) {
        return kaholoService.logout(profile);
    }
}

module.exports = new LogoutAction();
