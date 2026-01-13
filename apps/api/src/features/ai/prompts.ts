// Prompt templates for AI features

export const SUMMARIZE_PROMPT = `あなたはブックマークコンテンツを要約する専門家です。
以下のWebページのコンテンツを、300文字程度の日本語で要約してください。

要約のルール:
- 主要なポイントを簡潔にまとめる
- 専門用語は必要に応じて説明を加える
- ユーザーが後で見返したときに内容を思い出せるようにする
- 箇条書きは使わず、文章形式で記述する

コンテンツ:
{content}

要約:`;

export const GENERATE_TAGS_PROMPT = `あなたはブックマークのタグ付けの専門家です。
以下のWebページのコンテンツから、適切なタグを5個生成してください。

タグのルール:
- 1つのタグは1〜3語程度の短い単語またはフレーズ
- 英語またはカタカナで統一
- 一般的で再利用しやすいタグを優先
- 技術、カテゴリ、トピックなど分類に役立つタグ

コンテンツ:
{content}

タグ（カンマ区切りで出力してください）:`;

export function buildSummarizePrompt(content: string): string {
  return SUMMARIZE_PROMPT.replace('{content}', content);
}

export function buildGenerateTagsPrompt(content: string): string {
  return GENERATE_TAGS_PROMPT.replace('{content}', content);
}
