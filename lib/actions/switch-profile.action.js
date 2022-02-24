const inquirer = require("inquirer");
const kaholoService = require("../services/kaholo.service");
const cli = require("../cli");

class SwitchProfileAction {
    load(cli) {
        cli.prog
            .command("switch-profile")
            .description("Allow to switch easily between profiles")
            .argument('[profile]', 'The profile to switch to')
            // .option("--url <string>", "Kaholo environment URL")
            // .option("-p, --profile <string>", "The profile to switch to")
            .action(async (profile) => {
                this.run({ profile });
            });
    }

    async run({ profile }) {
        const existingProfiles = kaholoService.profiles;
        if(!existingProfiles.length){
            return cli.warning(`No profiles yet, please call login first`);
        }

        // if profile supplied and not exists
        if (profile && !existingProfiles.some(p=>p==profile)){
            return cli.exitWithMessage(`Profile ${profile} doesn't exists.`)
        } else if (profile){
            kaholoService.currentProfile = profile;
        } else {
            const { profileSelected } = await inquirer.prompt([
                {
                    name: "profileSelected",
                    type: "list",
                    message: "Select authentication type:",
                    choices: kaholoService.profiles,
                },
            ]);
            kaholoService.currentProfile = profileSelected;
        }
        
        cli.success(`Switched to profile '${kaholoService.currentProfile}'`);
    }

}

module.exports = new SwitchProfileAction();
