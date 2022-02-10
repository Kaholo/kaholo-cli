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
kaholo login [--url <kaholo_url>] [--email <user_email>]
```

If not provided by the command, you will be asked to type in your kaholo environment url.

You will be asked to choose between an authentication type: 
* email/password
* service account token

If user email provided by the command, the command will assume using email/password authentication type. 

Credentials are saved locally and will either be overwritten using another `kaholo login` command, or cleared using `kaholo logout`


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
