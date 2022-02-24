const inquirer = require("inquirer");
const kaholoService = require("../services/kaholo.service");
const cli = require("../cli");

class LoginAction {
    load(cli) {
        cli.prog
            .command("login")
            .description("Logs you into your kaholo environment")
            .option("--url <string>", "Kaholo environment URL")
            .option("-e, --email <string>", "email")
            .option("-p, --profile <string>", "The profile to save the credentials under. If not provided will use 'default'")
            .action(async ({ email, url, profile = 'default' }) => {
                this.run({ email, url, profile });
            });
    }

    async run({ email, url, profile }) {
        if (!url) {
            url = await this.askForKaholoUrl();
        }
        await kaholoService.verifyUrl(url);
        
        let token;
        if (email) {
            token = await this.loginWithUser(url, email);
        } else {
            const { usertype } = await inquirer.prompt([
                {
                    name: "usertype",
                    type: "list",
                    message: "Select authentication type:",
                    choices: ["Email and Password", "Service Account"],
                },
            ]);

            switch (usertype) {
                case "Email and Password":
                    token = await this.loginWithUser(url);
                    break;
                case "Service Account":
                    token = await this.loginWithServiceAccount();
                    break;
            }
        }
        await kaholoService.verifyToken(url,token);
        kaholoService.saveProfile(url,token,profile);
        
        cli.success(`Successfully logged in!`);
    }

    async askForKaholoUrl() {
        const questions = [
            {
                name: "kaholoUrl",
                type: "input",
                message: "Enter your Kaholo environment URL:",
            },
        ];

        const { kaholoUrl } = await inquirer.prompt(questions);
        return kaholoUrl;
    }

    async loginWithUser(url, email) {
        const questions = [
            {
                name: "password",
                type: "password",
                message: "Enter your password:",
            },
        ];

        if (!email) {
            questions.unshift({
                name: "answerEmail",
                type: "input",
                message: "Enter your Kaholo e-mail address:",
            });
        }

        const { answerEmail, password } = await inquirer.prompt(questions);
        return kaholoService.login(url, email || answerEmail, password);
    }

    async loginWithServiceAccount() {
        const questions = [
            {
                name: "token",
                type: "password",
                message: "Enter your service account token:",
            },
        ];

        const { token } = await inquirer.prompt(questions);
        return `Bearer  ${token}`;
    }
}

module.exports = new LoginAction();
