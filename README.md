# kaholo cli
* [Installation](#installation)
* [Authentication](#authentication)
* [Actions](#actions)
  * [Plugin Upload](#plugin-upload)
### Installation

```bash
git clone git@github.com:Kaholo/kaholo-cli.git
cd kaholo-cli
npm i
npm i -g
kaholo --help
```

For global install, you might need to run `sudo npm install --unsafe-perm -g`.

### Authentication

```bash
kaholo login [--url <kaholo_url>] [--email <user_email>] [--profile <profile>]
```

example: `kaholo login --url http://localhost:3000 --email admin@kaholo.io --profile local`

If not provided by the command, you will be asked to type in your kaholo environment url.

You will be asked to choose between an authentication type: 
* email/password
* service account token

If user email provided by the command, the command will assume using email/password authentication type. 

Credentials are saved locally and will either be overwritten using another `kaholo login` command, or cleared using `kaholo logout`

#### Switch Profile
You can check which profile you currently use:
```bash
kaholo current-profile
```

And if you would like to switch to another profile use:

```bash
kaholo switch-profile [profile]
```

Use this command to switch between your different profiles, if no profile specified, you will be promoted with a list of all profiles to choose from.

### Actions

#### Plugin Upload

```bash
kaholo plugin-upload [--path <path_to_plugin>]
```

Uploads the path specified as a new plugin. 
Path can be one of the following:
* Plugin zip file - will upload it as is
* Source code directory - will zip it and upload the zip file.

if no path specified, using current working directory.

**Notice**: The plugin's code will not be loaded by the agent straight away. It's always a good idea to restart the agent(s)
after the plugin is uploaded.
It might also be useful to restart the agent(s) if the plugin fails to upload.
