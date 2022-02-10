const path = require("path");
const archiver = require("archiver");
const fs = require("fs");
const gitignoreParser = require("parse-gitignore");

const TEMP_DIR_NANE = '.kaholotmp';
const TMP_PATH = path.join(process.cwd(), `./${TEMP_DIR_NANE}`);

class UtilsService {
    async zipDirectory(sourceDir, fileName) {
        await this.createDirIfNotExists(TMP_PATH);
        const outputPath = path.join(TMP_PATH, fileName);
        const stream = fs.createWriteStream(outputPath);

        const archive = archiver("zip", { zlib: { level: 9 } });
        const gitignorePath = path.join(sourceDir, '.gitignore');
        let excludeArray =
            fs.existsSync(gitignorePath) ?
            gitignoreParser(fs.readFileSync(gitignorePath)) : [];

        excludeArray = excludeArray.map((entry) => {
            const p = path.join(sourceDir, entry);
            return fs.existsSync(p) && fs.statSync(p).isDirectory() ? `${entry}/**` : entry;
        });

        return new Promise((resolve, reject) => {
            console.log(`Zipping directory '${sourceDir}' into '${outputPath}'...`);

            archive.glob("**/*", {
                cwd: sourceDir,
                ignore: [TEMP_DIR_NANE, ...excludeArray]
            })
            .on("error", (err) => reject(err))
            .pipe(stream);

            stream.on("close", () => {
                console.log(`Done Zipping`);
                resolve({
                    outputPath
                });
            });
            archive.finalize();
        });
    }

    async createDirIfNotExists(dirPath){
        if (!fs.existsSync(dirPath)) {
            return fs.promises.mkdir(dirPath, { recursive: true});
        }
    }
}

module.exports = new UtilsService();
