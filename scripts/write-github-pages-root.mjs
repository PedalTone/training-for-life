import { mkdir, writeFile } from "node:fs/promises";

const outputDirectory = new URL("../gh-pages-dist/", import.meta.url);
const canonicalAppPath = "./app/";

await mkdir(outputDirectory, { recursive: true });
await writeFile(new URL("index.html", outputDirectory), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${canonicalAppPath}" />
    <title>Training for Life</title>
    <script>location.replace(${JSON.stringify(canonicalAppPath)});</script>
  </head>
  <body><a href="${canonicalAppPath}">Open Training for Life</a></body>
</html>
`);
