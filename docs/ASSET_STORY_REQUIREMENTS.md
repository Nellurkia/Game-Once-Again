# 《再来一次》音乐、美术与剧情文案需求表

本表依据 Phase 1 PRD 和当前游戏源码整理。现有剧情对白仍是 `{TBD}` 占位；此表是交付清单与填稿模板，不表示这些正式资源已经制作。

## 音乐资源

当前阶段仅预留静音的 `AudioManager` 接口，没有音频文件或播放逻辑。正式音频建议按下列路径交付；首次接入时，再将清单加入音频 manifest 并连接 `playBgm`、`playSfx`。

| 优先级 | 使用位置／触发点 | 建议文件名 | 数量 | 交付要求 |
|---|---|---|---:|---|
| 建议必需 | 标题页、序章老年房间 | `public/assets/audio/bgm_room_twilight.mp3` | 1 | 黄昏、旧房间、回忆；可循环；无歌词。序章复用标题曲。 |
| 建议必需 | 第一幕·童年（一周目、二周目复用） | `public/assets/audio/bgm_ch1_childhood.mp3` | 1 | 童年探索感中带少许不安；可循环。 |
| 建议必需 | 第二幕·少年（一周目、二周目复用） | `public/assets/audio/bgm_ch2_adolescence.mp3` | 1 | 青春、错过的节拍；可循环。 |
| 建议必需 | 第三幕·青年（一周目、二周目复用） | `public/assets/audio/bgm_ch3_youth.mp3` | 1 | 向前奔跑，逐渐感到疲惫；可循环。 |
| 建议必需 | 第四幕·成年（一周目、二周目复用） | `public/assets/audio/bgm_ch4_adulthood.mp3` | 1 | 碎片、关系与整理；可循环。 |
| 建议必需 | 一周目结算／NEW GAME+ 解锁 | `public/assets/audio/bgm_interlude.mp3` | 1 | 由遗憾转向重来的机会；适合作为短过场或可循环曲。 |
| 建议必需 | 结局 NE「留下」 | `public/assets/audio/bgm_ending_ne.mp3` | 1 | 接纳此刻人生的收束感。 |
| 建议必需 | 结局 TE「和解」 | `public/assets/audio/bgm_ending_te.mp3` | 1 | 与原本的自己和解；可与 NE 共用动机，编曲须有区分。 |
| 建议必需 | 片尾字幕 | `public/assets/audio/bgm_credits.mp3` | 1 | 收束全曲，可循环或提供干净结束点。 |
| 建议必需 | 按钮确认、结局选择 | `public/assets/audio/sfx_ui_confirm.mp3`、`public/assets/audio/sfx_ending_select.mp3` | 2 | 短促清晰，避免刺耳。 |
| 建议必需 | 对话推进、幕布转场 | `public/assets/audio/sfx_dialogue_next.mp3`、`public/assets/audio/sfx_transition.mp3` | 2 | 短音效；可分别用于点击反馈和红幕转场。 |
| 第一阶段玩法 | 童年迷宫：收集碎片、撞到影子、抵达目标房间 | `public/assets/audio/sfx_memory_collect.mp3`、`public/assets/audio/sfx_ghost_hit.mp3`、`public/assets/audio/sfx_room_arrive.mp3` | 3 | 反馈差异清楚；重复触发时不突兀。 |
| 后续小游戏 | 节奏、跑酷、拼图交互 | `public/assets/audio/sfx_rhythm_hit.mp3`、`public/assets/audio/sfx_runner_jump.mp3`、`public/assets/audio/sfx_runner_hit.mp3`、`public/assets/audio/sfx_puzzle_place.mp3` | 4 | 对应玩法实现后接入；Phase 1 stub 不需要播放。 |
| 可选 | 老年房间环境底噪 | `public/assets/audio/amb_room_evening.mp3` | 1 | 轻微室内、窗外暮色氛围；不盖过对白，可关闭。 |

**建议交付规范：**配乐 MP3、44.1 kHz、立体声；单曲约 1–3 分钟，提供可无缝循环版本或标记循环点。音效 MP3/OGG、44.1 kHz，短音效建议单声道。另交 WAV 母带可供后期混音。音乐、人声和音效分轨；文件不带版权不明的采样或歌词。统一小写蛇形命名，禁止空格与 `final_final2` 一类版本名。若需改名，同步修改音频 manifest。

## 美术资源

现有 `public/data/manifest.json` 是**图片清单数组**，章节背景由 `src/scenes/ChapterScene.js` 按 `asset` 加载。图片可以通过改清单里的 `src` 替换，不需要改小游戏逻辑。当前插画和迷宫元素主要由代码内 SVG／Phaser 图形绘制；对应正式插画交付后，需将其接入 manifest 或场景。

| 优先级 | 资源／用途 | 建议文件名（仓库相对路径） | 规格与命名要求 | 接入说明 |
|---|---|---|---|---|
| 建议必需 | 标题页／序章黄昏房间主视觉 | `public/assets/title_room_twilight.png` | 1280×720，16:9；sRGB；需保留文字摆放安全区，文件无文字。 | 目前 SVG 场景写在 `src/ui/room.js`，manifest 中尚无此项；替换时需把插画移到资源文件，并将 `title_room` 加入清单、接入标题页与序章。 |
| 必需替换 | 第一幕·童年背景 | `public/assets/ch1_bg.png` | 1280×720；走廊／儿童房氛围，无界面字、按钮和游戏目标标记。 | 清单 ID `ch1_bg` 当前指向 `assets/ch1_bg.svg`；改为 PNG 时同步把 `src` 改为 `assets/ch1_bg.png`。 |
| 必需替换 | 第二幕·少年背景 | `public/assets/ch2_bg.png` | 1280×720；表现少年时期；为节奏玩法留出中间操作区。 | 将 `ch2_bg` 的 manifest `src` 改为 PNG 路径。 |
| 必需替换 | 第三幕·青年背景 | `public/assets/ch3_bg.png` | 1280×720；表现向前奔跑的青年阶段；主要障碍与角色区域需清楚。 | 将 `ch3_bg` 的 manifest `src` 改为 PNG 路径。 |
| 必需替换 | 第四幕·成年背景 | `public/assets/ch4_bg.png` | 1280×720；表现关系、生活碎片与成年阶段；避免把必要提示烘焙进背景。 | 将 `ch4_bg` 的 manifest `src` 改为 PNG 路径。 |
| 第一阶段玩法 | 童年迷宫墙体／地块图集 | `public/assets/ch1_maze_tiles.png` | 透明背景；每个地块同尺寸、网格对齐，附地块尺寸和 atlas 坐标。 | 当前墙、豆子、目标房间均由 Phaser 绘制；正式图集须接入 `pacman` renderer。 |
| 第一阶段玩法 | 玩家与影子 sprite sheet | `public/assets/ch1_characters.png` | 透明背景；逐帧统一尺寸；附命名帧表／atlas JSON；方向与动画状态分组。 | 当前角色与影子是圆形代码占位；接入时将 sprite sheet 加到 ch1 资源清单。 |
| 后续玩法 | 第二幕节拍／判定 UI | `public/assets/ch2_rhythm_atlas.png` | 透明背景；节拍提示、命中反馈、判定图标分图层，附 atlas 坐标。 | Rhythm stub 升级为实际小游戏时接入。 |
| 后续玩法 | 第三幕玩家／障碍图集 | `public/assets/ch3_runner_atlas.png` | 透明背景；角色动画与障碍物分组并提供帧表。 | Runner stub 升级为实际小游戏时接入。 |
| 后续玩法 | 第四幕拼图碎片图集 | `public/assets/ch4_puzzle_atlas.png` | 透明背景；拼图边缘和拼合状态可辨，提供原图预览及切片规则。 | Puzzle stub 升级为实际小游戏时接入。 |
| 建议 | NE 留下结局背景 | `public/assets/ending_ne_bg.png` | 1280×720；低细节、不烘焙文案，为结局文字留白。 | 结局演出实现时接入。 |
| 建议 | TE 和解结局背景 | `public/assets/ending_te_bg.png` | 1280×720；与 NE 色调／构图可辨地区分。 | 结局演出实现时接入。 |
| 建议 | 片尾背景 | `public/assets/credits_bg.png` | 1280×720；暗部文字对比充足；无署名文字烘焙在图内。 | 片尾字幕接入时使用；也可复用结局背景。 |

**交付文件约定：**PNG 使用 sRGB；纯背景 1280×720；透明 sprite 保留 Alpha，按 1× 原始逻辑像素制作，并提供 atlas／帧信息。SVG 仅用于矢量插画和 UI 图标。图像本身不放对白、章节标题或游戏内数字；在不同屏幕缩放时重要主体须位于中间安全区。统一提供资源 ID、预览图、文件名、尺寸和简短替换说明。字体如需随包提供，先核实可再分发许可。

## 剧情文案需求

按玩法 PRD，主题依次为「逃避—遗憾—重来—和解」；序章与幕间由通用场景壳显示对话。输入文档引用的剧情大纲和玩法 PDF 未随 PRD 提供，以下只定义**填稿格式和文件清单**，不替策划补写或推断具体剧情。

| 文案块 | 现有 `story.json` 键 | 需要交付的内容 | 建议篇幅／约束 |
|---|---|---|---|
| 序章 | `prologue` | 暮年主角在旧房间发现游戏机；游戏机提出重来的入口。 | 2 句起，每个 dialogue item 每屏不超过 100 汉字。 |
| 第一幕·童年 | `ch1_w1`、`ch1_w2` | 一周目逃避目标、二周目面对父母房间的新目标，各写开场对白。 | 每版至少 1 句；区别要能从目标和主角态度读出。 |
| 第二幕·少年 | `ch2_w1`、`ch2_w2` | 一周目错过节拍、二周目停下来听见自己的声音，各写开场对白。 | 每版至少 1 句；与节奏玩法目标一致。 |
| 第三幕·青年 | `ch3_w1`、`ch3_w2` | 一周目持续向前、二周目愿意等待身边的人，各写开场对白。 | 每版至少 1 句；与跑酷玩法目标一致。 |
| 第四幕·成年 | `ch4_w1`、`ch4_w2` | 一周目努力拼合生活、二周目接纳空白，各写开场对白。 | 每版至少 1 句；与拼图／关系目标一致。 |
| 幕后通用收束 | `outro` | 每次小游戏完成后的通用过场对白。 | 当前实现四幕和二周目共用同一段；若需每幕不同，需新增键并修改场景选取逻辑。 |
| NE 留下 | `NE` | 选择珍惜当前人生后，角色的结局对白。 | 建议 1–3 句。 |
| TE 和解 | `TE` | 选择接纳原本的自己后，角色的结局对白。 | 建议 1–3 句；与 NE 的落点清晰不同。 |
| BE 重来 | 无单独对白键 | 选择 NEW GAME+ 后直接进入二周目第一幕，构成循环。 | 当前实现无需 BE 终局对白；若剧情案要求单独演出，另增键并接入场景逻辑。 |
| 幕间／三选一／片尾 | 当前写在 `src/main.js` | 幕间标题与说明、三个结局选项标题与按钮、结尾字幕。 | 目前不是 `story.json` 数据；要做到文案只改 JSON，需把这些 UI 字串迁移到独立数据键并改渲染代码。 |

**当前可由 `story.json` 填写的最低量：**序章 2 屏、4 幕 × 2 个周目各 1 屏（8 屏）、通用幕尾 1 屏、NE／TE 各 1 屏，共 **13 屏**。幕间、终局选项、片尾目前是代码里的静态字串，另列入文案交付，不计入这 13 屏。

**每屏写作约定：**每个 item 只写一个 speaker 和一屏 text，字数 ≤100 汉字；标点计入篇幅；不要把换行排版、颜色、打字机速度或文件路径写进 `text`。选项用现有 `choices` 数组，每项含 `text` 和要记录的 `flag`；选择只会保存 flag，目前不会自动分支或判定结局，分支规则须另行设计并实现。避免无障碍读者必须靠颜色才能理解的关键信息。

## 剧情 JSON 文件模板

模板文件：[story.template.json](story.template.json)。写稿后按键名检查，可复制为 `public/data/story.json`。它保留当前对白数据结构；花括号 `{TBD}` 是待填写标记，不是剧情内容。

最小条目示例：

```json
{
  "speaker": "角色名或叙述者",
  "text": "这一屏对白（不超过 100 个汉字，含标点）"
}
```

带选项的示例：

```json
{
  "speaker": "角色名",
  "text": "这一屏对白与选项引导。",
  "choices": [
    { "text": "选项一", "flag": "choice_key_one" },
    { "text": "选项二", "flag": "choice_key_two" }
  ]
}
```

## 替换与验收清单

- [ ] 每份交付都带上述建议文件名；文件改名后同步 `manifest.json`／音频清单。
- [ ] 四个章节背景比例均为 16:9，无标题字、UI、目标标记或水印。
- [ ] sprite sheet 随附帧尺寸、帧名、排序和 atlas JSON。
- [ ] 正式音乐有可循环版本和授权说明；音效长度、响度适合重复触发。
- [ ] `story.json` 包含所有现有 key：`prologue`、`ch1_w1`／`ch1_w2` 至 `ch4_w1`／`ch4_w2`、`outro`、`NE`、`TE`。
- [ ] 每个对白 item 有 `speaker`、`text`；每屏不超过 100 汉字；无未填写 `{TBD}`。
- [ ] 剧情分支如依赖 flag，另附旗标清单、触发位置、结局判定表；不能假设现有代码已支持条件分支。
