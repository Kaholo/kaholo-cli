const inquirer = require("inquirer");
const kaholoService = require("../services/kaholo.service");
const cli = require("../cli");

class LoginAction {
    load(cli) {
        cli.prog
            .command("login")
            .description("Logs you into your kaholo environment")
            .option("--url <string>", "Kaholo environment URL")
            .option("-e, --email <string>", "username")
            .action(async ({ email, url }) => {
                this.run({ email, url });
            });
    }

    async run({ email, url }) {
        if (!url) {
            url = await this.askForKaholoUrl();
        }
        kaholoService.baseUrl = url;
        await kaholoService.verifyUrl();

        if (email) {
            await this.loginWithUser(email);
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
                    await this.loginWithUser();
                    break;
                case "Service Account":
                    await this.loginWithServiceAccount();
                    break;
            }
        }
        await kaholoService.verifyToken();
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

    async loginWithUser(email) {
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
        return kaholoService.login(email || answerEmail, password);
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
        kaholoService.token = `Bearer  ${token}`;
    }
}

module.exports = new LoginAction();
