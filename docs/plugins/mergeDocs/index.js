const { exec } = require("child_process");
const fs = require("fs");

const classes = ["Playlists", "Albums", "Tracks", "Users"];

function mergeMarkdownFiles(file1, file2, outputFile) {
  fs.readFile(file1, "utf8", (err, data1) => {
    if (err) {
      console.error("Error reading file1:", err);
      return;
    }

    fs.readFile(file2, "utf8", (err, data2) => {
      if (err) {
        console.error("Error reading file2:", err);
        return;
      }

      // Concatenate the contents of both files
      const mergedContent = data1 + "\n" + data2;

      // Write the merged content to the output file
      fs.writeFile(outputFile, mergedContent, (err) => {
        if (err) {
          console.error("Error writing to output file:", err);
          return;
        }

        console.log("Files merged successfully.");
      });
    });
  });
}

module.exports = function (context, options) {
  return {
    name: "merge-docs",
    async contentLoaded() {
      const merged = fs.existsSync("merged.txt");
      if (!merged) {
        try {
          classes.forEach((c) => {
            mergeMarkdownFiles(
              `docs/developers/sdk/classes/${c}Api.md`,
              `docs/developers/write-${c.toLowerCase()}.md`,
              `docs/developers/sdk/classes/${c}Api.md`
            );
          });
        } catch (err) {
          console.error("Error:", err);
        }
        fs.writeFileSync("merged.txt", "hi");
      }
    },
  };
};
