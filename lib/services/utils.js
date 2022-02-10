const path = require("path");
const archiver = require("archiver");
const fs = require("fs");

const TMP_PATH = path.join(__dirname, `../../tmp`);

class UtilsService {
    async zipDirectory(sourceDir, fileName) {
        await this.createDirIfNotExists(TMP_PATH);
        const outputPath = path.join(TMP_PATH, fileName);
        const stream = fs.createWriteStream(outputPath);

        const archive = archiver("zip", { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            console.log(`Zipping directory '${sourceDir}' into '${outputPath}'...`);


            archive
                .glob('**', {
                    cwd: sourceDir,
                    ignore: ['node_modules/**', '*.zip', 'package-lock.json']
                }).on("error", (err) => reject(err))
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
        await fs.promises.exis
        if (!fs.existsSync(dirPath)) {
            return fs.promises.mkdir(dirPath, { recursive: true});
        }
    }
}

module.exports = new UtilsService();
