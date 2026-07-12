// 管理者パスワードの PBKDF2 ハッシュを生成する。
// 対話実行: node scripts/hash-password.ts  (プロンプトにパスワードを入力。画面には表示されない)
// パイプ実行: printf '%s' "$PW" | node scripts/hash-password.ts
// 反復回数を変える場合は第1引数に指定 (デフォルト: DEFAULT_ITERATIONS)
import { hashPassword, DEFAULT_ITERATIONS } from "../src/lib/password.ts";

const iterations = process.argv[2] ? parseInt(process.argv[2], 10) : DEFAULT_ITERATIONS;

function readPasswordFromTty(): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stderr.write("パスワード: ");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      process.stderr.write("\n");
    };
    const onData = (chunk: string) => {
      for (const c of chunk) {
        if (c === "\r" || c === "\n") {
          cleanup();
          resolve(buf);
          return;
        }
        if (c === "\u0003") {
          // Ctrl-C
          cleanup();
          process.exit(130);
        }
        if (c === "\u007f" || c === "\b") {
          buf = buf.slice(0, -1);
        } else {
          buf += c;
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function readPasswordFromPipe(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8").replace(/\n$/, "");
}

const password = process.stdin.isTTY ? await readPasswordFromTty() : await readPasswordFromPipe();

if (!password) {
  console.error("パスワードが空です");
  process.exit(1);
}

console.log(await hashPassword(password, iterations));
