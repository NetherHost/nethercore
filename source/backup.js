// Copyright 2025 Nether Host

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const color = require("chalk");

const backupDirectory = path.resolve(__dirname, "../", "backups");

const files = [
  ".env",
  ".gitignore",
  "pnpm-lock.yaml",
  "package.json",
  "readme.md",
  "eslint.config.mjs",
  "build.js",
];

const dirs = ["messages", "transcripts", "source"];

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFolder = path.resolve(backupDirectory, `backup-${timestamp}`);
  const file = path.resolve(backupFolder, `backup-${timestamp}.zip`);

  if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory);
  }

  fs.mkdirSync(backupFolder);

  const output = fs.createWriteStream(file);
  const archive = archiver("zip", { zlib: { level: 9 } });

  console.log(
    color.green("[INFO] ") +
      color.white(`Creating backup: ${path.basename(file)}`)
  );

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);

  files.forEach((file) => {
    const filePath = path.resolve(__dirname, "../", file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: path.basename(file) });
    } else {
      console.log(color.red("[ERROR] ") + color.white(`${filePath} not found`));
    }
  });

  dirs.forEach((folder) => {
    const folderPath = path.resolve(__dirname, "../", folder);
    if (fs.existsSync(folderPath)) {
      archive.directory(folderPath, path.basename(folder));
    } else {
      console.log(
        color.red("[ERROR] ") + color.white(`${folderPath} not found`)
      );
    }
  });

  archive.finalize();
}

module.exports = { createBackup };
