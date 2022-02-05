const fs = require("fs");
const path = require("path");
const utils = require("../services/utils");
const cli = require('../cli');
const kaholoService = require("../services/kaholo.service");

class PluginUploadAction {
    
    load(cli){
        cli.prog
            .command("plugin-upload")
            .description("Uploads the path specified as a new plugin. if no path specified, using current working directory.")
            .option("-p, --path <path>", "Path to zip file or another directory")
            .action(async ({path}) => {
                this.run(path);
            });
    }
    
    async run(suppliedPath) {
        suppliedPath = suppliedPath || process.cwd();
        // Normalize path to absolute
        if (!path.isAbsolute(suppliedPath)) {
            suppliedPath = path.join(process.cwd(), suppliedPath);
        }
        // Check if path exists
        const exists = fs.existsSync(suppliedPath);
        if (!exists) {
            return cli.exitWithMessage(`File '${suppliedPath}' does not exists.`);
        }
        // Get Path data
        const stats = await fs.promises.lstat(suppliedPath);
        const pathData = path.parse(suppliedPath);
        let zipFileName, zipFilePath;
        if (stats.isDirectory()) {
            zipFileName = `${pathData.name}-${new Date().getTime()}.zip`;
            const { outputPath } = await utils.zipDirectory(suppliedPath, zipFileName);
            zipFilePath = outputPath;
        } else if (stats.isFile()) {
            if (pathData.ext.toLowerCase() !== ".zip") {
                return cli.exitWithMessage(`File '${suppliedPath}' is not a zip file.`);
            }
            zipFileName = pathData.name;
            zipFilePath = suppliedPath;
        }

        return kaholoService.uploadPlugin(zipFilePath,zipFileName);
    }
}


module.exports = new PluginUploadAction();
