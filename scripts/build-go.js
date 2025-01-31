// Copyright 2025 Nether Host

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const color = require("chalk");

console.log(color.green("[INFO] ") + color.white("Building Go binaries..."));

const goDirs = [path.join("source", "utils", "ai")];

let failed = false;

for (const dir of goDirs) {
  console.log(color.green("[INFO] ") + color.white(`Building ${dir}...`));

  if (!fs.existsSync(path.join(dir, "go.mod"))) {
    console.log(
      color.green("[INFO] ") +
        color.white(`Initializing Go module in ${dir}...`)
    );
    const moduleName = path.basename(dir);
    const initCommand = `cd "${dir}" && go mod init ${moduleName}`;

    try {
      exec(initCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(
            color.red("[ERROR] ") +
              color.white(`Error initializing module in ${dir}:`, error)
          );
          failed = true;
          return;
        }
        if (stderr) {
          console.warn(
            color.yellow("[WARN] ") +
              color.white(`Warnings for ${dir} module init:`, stderr)
          );
        }
        console.log(
          color.green("[INFO] ") +
            color.white(`Successfully initialized module in ${dir}`)
        );
      });
    } catch (error) {
      console.error(
        color.red("[ERROR] ") +
          color.white(`Failed to initialize module in ${dir}`)
      );
      failed = true;
      continue;
    }
  }

  const command =
    process.platform === "win32"
      ? `cd "${dir}" && go build -o main.exe`
      : `cd "${dir}" && go build -o main`;

  try {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(
          color.red("[ERROR] ") + color.white(`Error building ${dir}:`, error)
        );
        failed = true;
        return;
      }
      if (stderr) {
        console.warn(
          color.yellow("[WARN] ") + color.white(`Warnings for ${dir}:`, stderr)
        );
      }
      console.log(
        color.green("[INFO] ") + color.white(`Successfully built ${dir}`)
      );
    });
  } catch (error) {
    console.error(
      color.red("[ERROR] ") + color.white(`Failed to build ${dir}`)
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
