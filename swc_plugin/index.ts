import { prepare } from "../deps.ts";
import { ParseOptions, AnalyzeOptions } from "../types/options.ts";
import { version } from "../version.ts";

const filenameBase = "deno_swc";

const PLUGIN_URL_BASE =
  `https://github.com/nestdotland/deno_swc/releases/download/${version}`;

const isDev = Deno.env.get("DEV");

if (isDev) {
  const { filenamePrefix, filenameSuffix } = (() => {
    switch (Deno.build.os) {
      case "darwin": {
        return { filenamePrefix: "lib", filenameSuffix: ".dylib" };
      }
      case "linux": {
        return { filenamePrefix: "lib", filenameSuffix: ".so" };
      }
      case "windows": {
        return { filenamePrefix: "", filenameSuffix: ".dll" };
      }
    }
  })();

  const filename =
    `./target/debug/${filenamePrefix}${filenameBase}${filenameSuffix}`;

  // This will be checked against open resources after Plugin.close()
  // in runTestClose() below.
  const resourcesPre = Deno.resources();

  const rid = Deno.openPlugin(filename);
} else {
  const pluginId = await prepare({
    name: "deno_swc",
    printLog: true,
    checkCache: Boolean(Deno.env.get("CACHE")) || true,
    urls: {
      darwin: `${PLUGIN_URL_BASE}/lib${filenameBase}.dylib`,
      windows: `${PLUGIN_URL_BASE}/${filenameBase}.dll`,
      linux: `${PLUGIN_URL_BASE}/lib${filenameBase}.so`,
    },
  });
}

// @ts-ignore
const core = Deno.core as {
  ops: () => { [key: string]: number };
  setAsyncHandler(rid: number, handler: (response: Uint8Array) => void): void;
  dispatch(
    rid: number,
    msg: any,
    buf?: ArrayBufferView,
  ): Uint8Array | undefined;
};

const {
  parse,
  extract_dependencies,
  print,
  transform,
  bundle,
} = core.ops();

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export function swc_print(opt: object) {
  const response = core.dispatch(
    print,
    textEncoder.encode(JSON.stringify(opt)),
  );
  return JSON.parse(textDecoder.decode(response));
}

export function swc_parse_ts(opt: { src: string; opt?: ParseOptions }) {
  const response = core.dispatch(
    parse,
    textEncoder.encode(JSON.stringify(opt)),
  );
  return JSON.parse(textDecoder.decode(response));
}

export function swc_extract_dependencies(opt: AnalyzeOptions) {
  const response = core.dispatch(
    extract_dependencies,
    textEncoder.encode(JSON.stringify(opt)),
  );
  return JSON.parse(textDecoder.decode(response));
}

export function swc_transform(src: string) {
  const response = core.dispatch(
    transform,
    textEncoder.encode(JSON.stringify(src)),
  );
  return JSON.parse(textDecoder.decode(response));
}

export function swc_bundle(cnf: object) {
  const response = core.dispatch(
    bundle,
    textEncoder.encode(JSON.stringify(cnf)),
  );
  return JSON.parse(textDecoder.decode(response));
}
