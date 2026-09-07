import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {fileURLToPath,pathToFileURL} from "node:url";
import {resolve,sep} from "node:path";

const root = fileURLToPath(new URL("../../",import.meta.url));
const frontend = resolve(root,"custom_components/s8_omni/frontend");

export function createFixtureServer() {
  return createServer(async (request,response) => {
    const pathname = new URL(request.url,"http://localhost").pathname;
    let path = resolve(root,"tests/ui/fixture.html");
    if (pathname.startsWith("/frontend/") || pathname.startsWith("/s8_omni/frontend/")) {
      path = resolve(frontend,pathname.replace(/^\/(?:s8_omni\/)?frontend\//,""));
      if (!path.startsWith(frontend+sep)) { response.writeHead(403).end(); return; }
    } else if (pathname !== "/") { response.writeHead(404).end(); return; }
    try {
      const type = path.endsWith(".js") ? "text/javascript" : path.endsWith(".webp") ? "image/webp" : "text/html";
      response.writeHead(200,{"Content-Type":type,"Cache-Control":"no-store"}).end(await readFile(path));
    } catch { response.writeHead(404).end(); }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const server = createFixtureServer();
  const port = Number(process.env.S8_UI_FIXTURE_PORT || 8765);
  server.listen(port,"127.0.0.1",() => console.log(`S8 synthetic fixture: http://127.0.0.1:${port}/?tools=1`));
}
