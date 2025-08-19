# Image Editor MCP Server

画像編集機能を提供する Model Context Protocol (MCP) サーバーです。画像の明るさ調整、トリミング、圧縮などの基本的な画像編集操作を MCP クライアントから利用できます。

## 機能

この MCP サーバーは以下の画像編集機能を提供します：

- **明るさ調整** (`adjustBrightness`): 画像の明るさを 0.1〜10 倍の範囲で調整
- **画像トリミング** (`cropImage`): 指定された座標とサイズで画像をトリミング
- **画像圧縮** (`compressImage`): JPEG、PNG、WebP 形式の画像を指定品質で圧縮

## インストール

### 方法 1: npx を使用（推奨）

```bash
# 直接実行（毎回ダウンロード）
npx image-editor-mcp /path/to/your/images
```

### 方法 2: グローバルインストール

```bash
npm install -g image-editor-mcp
image-editor-mcp /path/to/your/images
```

### 方法 3: ローカルインストール

```bash
git clone <repository-url>
cd image-editor-mcp
npm install
npm run build
node build/index.js /path/to/your/images
```

## 使用方法

### 基本的な起動

```bash
# 画像フォルダのパスを指定して起動
npx image-editor-mcp /path/to/your/images
```

### 利用可能なツール

#### 1. 明るさ調整 (adjustBrightness)

画像の明るさを調整します。

**パラメータ:**

- `filePath`: 画像ファイル名（例: `photo.jpg`）
- `level`: 明るさレベル（0.1〜10、1 が通常、1.5 で明るく、0.5 で暗く）

**使用例:**

```json
{
  "filePath": "photo.jpg",
  "level": 1.5
}
```

#### 2. 画像トリミング (cropImage)

指定された範囲で画像をトリミングします。

**パラメータ:**

- `filePath`: 画像ファイル名
- `left`: トリミング領域の左上 X 座標
- `top`: トリミング領域の左上 Y 座標
- `width`: トリミングする幅
- `height`: トリミングする高さ

**使用例:**

```json
{
  "filePath": "photo.jpg",
  "left": 100,
  "top": 50,
  "width": 400,
  "height": 300
}
```

#### 3. 画像圧縮 (compressImage)

画像の品質を調整してファイルサイズを削減します。

**パラメータ:**

- `filePath`: 画像ファイル名
- `quality`: 圧縮後の品質（1〜100、80 が推奨）

**使用例:**

```json
{
  "filePath": "large_photo.jpg",
  "quality": 80
}
```

## MCP クライアントでの設定

### Claude for Desktop

設定ファイル: `~/.config/claude-desktop/mcp-servers.json` (macOS/Linux) または `%APPDATA%\claude-desktop\mcp-servers.json` (Windows)

```json
{
  "mcpServers": {
    "image-editor": {
      "command": "npx",
      "args": ["image-editor-mcp", "/path/to/your/images"],
      "cwd": "/path/to/your/images",
      "description": "画像編集機能を提供するMCPサーバー"
    }
  }
}
```

### グローバルインストールを使用する場合

```json
{
  "mcpServers": {
    "image-editor": {
      "command": "image-editor-mcp",
      "args": ["/path/to/your/images"],
      "cwd": "/path/to/your/images"
    }
  }
}
```

### 複数の MCP サーバーを同時使用

```json
{
  "mcpServers": {
    "image-editor": {
      "command": "npx",
      "args": ["image-editor-mcp", "/path/to/images"],
      "cwd": "/path/to/images"
    },
    "other-server": {
      "command": "npx",
      "args": ["other-mcp-server"],
      "cwd": "/path/to/workspace"
    }
  }
}
```

## セキュリティ

- 指定された画像フォルダ外のファイルにはアクセスできません
- パス検証により、ディレクトリトラバーサル攻撃を防止
- 編集された画像は元のファイルを変更せず、新しいファイルとして保存

## 対応画像形式

- **入力**: JPEG, PNG, WebP
- **出力**: 元の形式を維持（圧縮時は品質調整）

## 開発

### 必要な環境

- Node.js 18 以上
- npm または yarn

### セットアップ

```bash
# 依存関係のインストール
npm install

# TypeScriptのビルド
npm run build

# 開発用の起動
npm start /path/to/images
```

### プロジェクト構造

```
image-editor-mcp/
├── src/
│   └── index.ts          # メインのMCPサーバーコード
├── build/                # ビルド出力（自動生成）
├── package.json          # プロジェクト設定
├── tsconfig.json         # TypeScript設定
└── README.md            # このファイル
```

## トラブルシューティング

### よくある問題

1. **パスが見つからない**

   - 絶対パスを使用しているか確認
   - 指定したディレクトリが存在するか確認

2. **権限エラー**

   - 画像フォルダへの読み書き権限を確認
   - 管理者権限が必要な場合があります

3. **npx が見つからない**

   - Node.js と npm が正しくインストールされているか確認
   - `node --version` と `npm --version` で確認

4. **MCP クライアントで接続できない**
   - 設定ファイルのパスが正しいか確認
   - クライアントを再起動
   - サーバーが正常に起動しているか確認

## ライセンス

ISC License

## 貢献

バグレポートや機能リクエストは、GitHub の Issues ページでお知らせください。

## 更新履歴

- **v1.0.0**: 初回リリース
  - 明るさ調整機能
  - 画像トリミング機能
  - 画像圧縮機能
  - MCP プロトコル対応
