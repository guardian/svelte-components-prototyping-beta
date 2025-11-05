import { spawn } from "child_process"
import fs from "fs"
import path from "path"

const mainHTML = fs.readFileSync(path.join("build/default", "main.html"), {
  encoding: "utf8",
})

const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Vite preview</title>
    <link rel="stylesheet" type="text/css" href="./style.css">
  </head>
  <body>
	${mainHTML}
    <script src="./app.js"></script>
  </body>
</html>

`

fs.writeFileSync(path.join("build/preact", "index.html"), html)

serve()

function serve() {
  let server

  function toExit() {
    if (server) server.kill(0)
  }

  if (server) return
  server = spawn(
    "npx",
    ["vite", "preview", "--", "--outDir", "build/preact", "--host"],
    {
      stdio: ["ignore", "inherit", "inherit"],
      shell: true,
    },
  )

  process.on("SIGTERM", toExit)
  process.on("exit", toExit)
}
