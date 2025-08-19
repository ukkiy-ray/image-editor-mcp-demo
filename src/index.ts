#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import sharp from "sharp";
import path from "path";
import fs from "fs";

// --- サーバー設定 ---
// 起動時の引数から画像フォルダのパスを取得
const imageFolderPath = process.argv[2];

if (!imageFolderPath) {
  console.error("エラー: 画像フォルダのパスを引数で指定してください。");
  console.error("例: node build/index.js /path/to/your/images");
  process.exit(1);
}

if (
  !fs.existsSync(imageFolderPath) ||
  !fs.lstatSync(imageFolderPath).isDirectory()
) {
  console.error(
    `エラー: 指定されたパスが見つからないか、ディレクトリではありません: ${imageFolderPath}`
  );
  process.exit(1);
}

const resolvedImageFolderPath = path.resolve(imageFolderPath);
console.error(`画像フォルダを '${resolvedImageFolderPath}' に設定しました。`);

// --- MCPサーバーの初期化 ---
const server = new McpServer({
  name: "image-editor-mcp",
  version: "1.0.0",
  capabilities: {
    tools: {}, // このサーバーはTools機能を提供します
  },
});

// --- ヘルパー関数 ---
/**
 * セキュリティのためのパス検証
 * ファイルパスが指定された画像フォルダ内に存在することを確認します。
 * @param filePath ユーザーから提供された相対パス
 * @returns 検証済みの絶対パス
 */
function getSafeImagePath(filePath: string): string {
  // 絶対パスに解決
  const absolutePath = path.resolve(resolvedImageFolderPath, filePath);
  // 指定されたディレクトリの外に出ていないかチェック
  if (!absolutePath.startsWith(resolvedImageFolderPath)) {
    throw new Error(
      "セキュリティエラー: 指定されたフォルダ外のファイルにはアクセスできません。"
    );
  }
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`エラー: ファイルが見つかりません: ${filePath}`);
  }
  return absolutePath;
}

/**
 * 新しい編集済みファイルパスを生成します。
 * @param originalPath 元のファイルの絶対パス
 * @param suffix ファイル名に追加する接尾辞 (例: "-cropped")
 * @returns 新しいファイルの絶対パス
 */
function getNewEditedFilePath(originalPath: string, suffix: string): string {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  const name = path.basename(originalPath, ext);
  const newFilename = `${name}${suffix}${ext}`;
  return path.join(dir, newFilename);
}

// --- Toolsの実装 ---

// 1. 画像の明るさを調整するTool
server.tool(
  "adjustBrightness",
  "画像の明るさを調整します。",
  {
    filePath: z
      .string()
      .describe(
        "画像フォルダ内の編集したい画像のファイル名 (例: my_photo.jpg)"
      ),
    level: z
      .number()
      .min(0.1)
      .max(10)
      .describe(
        "明るさのレベル。1が通常、1より大きいと明るく、1より小さいと暗くなります。(例: 1.5)"
      ),
  },
  async ({ filePath, level }) => {
    try {
      const imagePath = getSafeImagePath(filePath);
      // 新しいファイルパスを生成
      const newPath = getNewEditedFilePath(imagePath, `-brightened-${level}`);
      const newFilename = path.basename(newPath);

      await sharp(imagePath).modulate({ brightness: level }).toFile(newPath); // 新しいパスに保存

      return {
        content: [
          {
            type: "text",
            text: `${filePath} の明るさを調整し、'${newFilename}' として保存しました。`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          { type: "text", text: `エラーが発生しました: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

// 2. 画像をトリミングするTool
server.tool(
  "cropImage",
  "指定された範囲で画像をトリミングします。アスペクト比は維持されます。",
  {
    filePath: z
      .string()
      .describe("画像フォルダ内の編集したい画像のファイル名 (例: family.png)"),
    left: z.number().int().min(0).describe("トリミング領域の左上のX座標"),
    top: z.number().int().min(0).describe("トリミング領域の左上のY座標"),
    width: z.number().int().min(1).describe("トリミングする幅"),
    height: z.number().int().min(1).describe("トリミングする高さ"),
  },
  async ({ filePath, left, top, width, height }) => {
    try {
      const imagePath = getSafeImagePath(filePath);
      // 新しいファイルパスを生成
      const newPath = getNewEditedFilePath(imagePath, "-cropped");
      const newFilename = path.basename(newPath);

      await sharp(imagePath)
        .extract({ left, top, width, height })
        .toFile(newPath); // 新しいパスに保存

      return {
        content: [
          {
            type: "text",
            text: `${filePath} をトリミングし、'${newFilename}' として保存しました。`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          { type: "text", text: `エラーが発生しました: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

// 3. 画像を圧縮するTool
server.tool(
  "compressImage",
  "画像の品質を調整して軽量化（圧縮）します。",
  {
    filePath: z
      .string()
      .describe(
        "画像フォルダ内の編集したい画像のファイル名 (例: heavy_image.jpg)"
      ),
    quality: z
      .number()
      .int()
      .min(1)
      .max(100)
      .describe("圧縮後の品質 (1から100の整数、80が推奨)"),
  },
  async ({ filePath, quality }) => {
    try {
      const imagePath = getSafeImagePath(filePath);
      // 新しいファイルパスを生成
      const newPath = getNewEditedFilePath(imagePath, `-compressed-${quality}`);
      const newFilename = path.basename(newPath);
      const extension = path.extname(imagePath).toLowerCase();

      let sharpInstance = sharp(imagePath);

      if (extension === ".jpeg" || extension === ".jpg") {
        sharpInstance = sharpInstance.jpeg({ quality });
      } else if (extension === ".png") {
        sharpInstance = sharpInstance.png({ quality });
      } else if (extension === ".webp") {
        sharpInstance = sharpInstance.webp({ quality });
      } else {
        throw new Error(
          "この画像形式の圧縮はサポートされていません: jpeg, png, webpのみ対応しています。"
        );
      }

      await sharpInstance.toFile(newPath); // 新しいパスに保存

      return {
        content: [
          {
            type: "text",
            text: `${filePath} を品質 ${quality} で圧縮し、'${newFilename}' として保存しました。`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          { type: "text", text: `エラーが発生しました: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

// --- サーバーの起動 ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    "画像編集MCPサーバーがstdio上で起動しました。クライアントからの接続を待っています..."
  );
}

main().catch((error) => {
  console.error("サーバーの起動中に致命的なエラーが発生しました:", error);
  process.exit(1);
});
