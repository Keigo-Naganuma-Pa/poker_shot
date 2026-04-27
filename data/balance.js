// balance.js
// ゲームバランスパラメータ — すべての数値定数はここで管理する
// index.html 内に数値を直書きしないこと

'use strict';

// ── プレイヤー ──────────────────────────────────────────────────
const PLAYER_COUNT          = 6;    // プレイヤー総数（AI + 人間）
const INITIAL_HP            = 15;   // 初期HP

// ── ダメージ ────────────────────────────────────────────────────
const SHOT_DAMAGE           = 1;    // ショット1発あたりのダメージ

// ── タイマー（秒）──────────────────────────────────────────────
const EXCHANGE_TIMER        = 60;    // カード交換フェーズの制限時間
const BET_TIMER             = 60;    // ベット・ショットフェーズの制限時間
const RESULT_DISPLAY_TIME   = 15;    // 結果表示時間

// ── カード判定 ──────────────────────────────────────────────────
const ACE_VALUE             = 14;   // エースの数値
const SWAP_THRESHOLD        = 7;    // これ以下なら交換を検討
const BET_THRESHOLD         = 8;    // これ以上なら強気に行動

// ── AIブラフ確率 ────────────────────────────────────────────────
const BLUFF_RATE_HONEST     = 0.1;  // 正直型AIのブラフ率
const BLUFF_RATE_BLUFFER    = 0.8;  // ブラフ型AIのブラフ率
const BLUFF_RATE_RANDOM     = 0.5;  // ランダム型AIのブラフ率

// ── 演出 ────────────────────────────────────────────────────────
const SHOT_FLASH_DURATION   = 0.5;  // ショット時フラッシュ / カードフリップ時間（秒）
const ELIMINATION_PAUSE     = 0;  // 脱落演出ポーズ時間（秒）
const BONUS_TEXT_DURATION   = 2.0;  // ボーナス演出：脱落テキスト表示時間（秒）
const BONUS_IMG_DURATION    = 5.0;  // ボーナス演出：テキスト非表示後の画像継続時間（秒）
const REVEAL_SHOW_TIME      = 1.5;  // カード公開フェーズ: カード表示継続時間（秒）
const SPEECH_DURATION       = 2.5;  // AI セリフ表示時間（秒）

// ── リアクションログ（BUILD 0005）──────────────────────────────────
const REACTION_INTERVAL    = 9;   // 秒：新しいリアクション生成間隔
const SPEECH_ROTATION_INTERVAL = 3;  // 秒：吹き出し発言の交代間隔
const SPEECH_ACTIVE_COUNT      = 2;    // 同時に吹き出しを表示するNPC数
const REACTION_LOG_MAX     = 10;   // ログに保持する最大件数
const REACTION_LOG_FADE    = 2;  // 秒：新着エントリのハイライト時間

// ── BUILD 0005 演出タイミング ─────────────────────────────────────
const SHOW_DECISIONS_TIME  = 3.5;  // 選択結果表示フェーズ時間（秒）
const HYPE_DURATION        = 3.0;  // 盛り上げ演出フェーズ時間（秒）
const HYPE_CD_START        = 0.5;  // カウントダウン開始オフセット（秒）
const HYPE_CD_STEP         = 0.6;  // カウントダウン1ステップ時間（秒）
const HYPE_FLASH_AT        = 2.3;  // フラッシュ開始オフセット（秒）
const HYPE_FLASH_DUR       = 0.4;  // フラッシュ持続時間（秒）
const HYPE_GLASS_DUR       = 0.2;  // ショットグラス拡大時間（秒）

// ── NPC 画像（BUILD 0006）────────────────────────────────────────
const NPC_IMAGE_STATES   = 3;  // 0=通常 1=ほろ酔い 2=泥酔
const NPC_IMG_STATE1_HP  = 5;  // HP がこの値以下になったら _1 に切替
const NPC_IMG_STATE2_HP  = 2;  // HP がこの値以下になったら _2 に切替
// ※ HP が一気に 0 になった場合（脱落）は画像を変えない
const NPC_IMG_W        = 210; // 表示幅（BASE_RES基準px）
const NPC_IMG_H        = 230; // 表示高さ（BASE_RES基準px）
const NPC_CARD_W       = 48;  // NPCスロット用カード幅（px）
const NPC_CARD_H       = 64;  // NPCスロット用カード高さ（px）

// ── BUILD 0012 演出タイミング ─────────────────────────────────────
const BET_DECISION_DELAY   = 5;    // 秒：ベットフェーズ開始からBET/FOLD表示までの遅延（未使用）
const HIGHLIGHT_CARDS_TIME = 1.5;  // 秒：ハイライトフェーズ時間
const JUDGE_TIME           = 1.0;  // 秒：判定フェーズ時間
const NPC_FLIP_HALF_DUR    = 0.3;  // 秒：NPCフリップアニメーション片道時間（全体0.6秒）
const FOLD_REVEAL_TIME     = 2.5;  // 秒：フォールド後カード開示フェーズ時間

// ── BUILD 0021: 順位ダイアログ ────────────────────────────────────
const RANK_ENTRY_INTERVAL  = 0.5;  // 秒：順位エントリ表示間隔
const RANK_HOLD_TIME       = 1.0;  // 秒：全エントリ表示後の保持時間

// ── BUILD 0024: 酔い状態の AI betThreshold 補正 ──────────────────
// imageState 0=通常 / 1=ほろ酔い / 2=泥酔 に対応した betThreshold 減算値
// 酔うほど閾値が下がりベットしやすくなる（判断力低下）
const DRUNK_BET_DELTA = [0, 2, 4];

// ── NPC ロスター（10体） ─────────────────────────────────────────
// bluffRate    : 0.0〜1.0（判断を反転させる確率）
// betThreshold : この値以上の期待値でベット意図
// swapThreshold: この値以下のカードで交換意図
const NPC_ROSTER = [
  // ヒューマン  : 読めない新人。平均的なパラメータ
  { name: 'アリシア',  personality: 'ビギナー',    bluffRate: 0.5,  betThreshold: 7,  swapThreshold: 7,  imageId: 'alicia' },
  // エルフ     : 冷静な分析家。ブラフほぼなし・高閾値
  { name: 'シルフィー', personality: '分析家',     bluffRate: 0.05, betThreshold: 9,  swapThreshold: 8,  imageId: 'silfy'  },
  // ダークエルフ: 高ブラフ率の嘘つき
  { name: 'ナイア',    personality: '嘘つき',      bluffRate: 0.85, betThreshold: 8,  swapThreshold: 7,  imageId: 'naia'   },
  // ドワーフ   : 低閾値で常に強引にベット
  { name: 'イェルダ',    personality: '強引',        bluffRate: 0.2,  betThreshold: 3,  swapThreshold: 4,  imageId: 'yelda'   },
  // ケットシー : 気まぐれで読めない
  { name: 'ミィア',    personality: '読めない',    bluffRate: 0.5,  betThreshold: 7,  swapThreshold: 7,  imageId: 'mia'    },
  // サキュバス : スリル好きのギャンブラー。低閾値で積極的
  { name: 'ルシェル',  personality: 'ギャンブラー', bluffRate: 0.25, betThreshold: 5,  swapThreshold: 5,  imageId: 'leciel' },
  // フェアリー : 超高閾値の臆病者。めったにベットしない
  { name: 'ティナ',    personality: '臆病者',      bluffRate: 0.15, betThreshold: 11, swapThreshold: 9,  imageId: 'tina'   },
  // ウェアウルフ: 本能で動く熱血漢。低閾値・強気
  { name: 'フェナ',    personality: '熱血漢',      bluffRate: 0.3,  betThreshold: 4,  swapThreshold: 5,  imageId: 'faena'  },
  // ジャイアント: 意外と慎重。高閾値・低ブラフ
  { name: 'ガイア',    personality: '慎重派',      bluffRate: 0.1,  betThreshold: 10, swapThreshold: 8,  imageId: 'gaia'   },
  // ドラゴニュート: 動じない冷静型。バランス重視
  { name: 'ヴァール',  personality: '冷静',        bluffRate: 0.1,  betThreshold: 9,  swapThreshold: 7,  imageId: 'vael'   },
];
