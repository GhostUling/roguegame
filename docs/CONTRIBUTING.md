# 开发说明

几何超载 —— 纯几何肉鸽割草生存游戏。Vite + React 19 + TypeScript，Canvas 2D 程序化绘制，零美术资源。

这份文档说明代码怎么组织、一次改动会牵动哪些文件。硬约束（提交前必读的规则）在根目录 `AGENTS.md`。

## 命令

```bash
npm install
npm run dev     # 开发服务器，http://localhost:3000 (--host 0.0.0.0)
npm run lint    # tsc --noEmit，提交前必须 0 错
npm run build   # 生产构建
npm test        # vitest run，纯函数模块的行为测试
npm run preview # 预览构建产物
```

测试只覆盖不需要 canvas 的纯函数模块（数值表、属性换算、模式旋钮）。`engine.ts` 的循环与 `renderer.ts` 的绘制没有自动化回归，改了这两处必须人肉玩一遍。

## 分层

```
UI 层        src/components/*.tsx      只渲染与回调，不含游戏规则
编排层       src/App.tsx               界面状态机，把引擎状态喂给 UI
              src/game/engine.ts       游戏状态 + update 流水线（约 2000 行）
数据层       src/game/modes.ts         模式描述表（模式差异的唯一来源）
              src/game/characters/     一台机体一个文件（数值 + 外观）
              src/game/{enemyTypes,upgrades,codexData}.ts
工厂层       src/game/player.ts        开局玩家状态构造（合体属性在这里算）
规则层       src/game/pilots.ts        双机编队、副机属性换算
              src/game/drones.ts        无人机射速/伤害算式（引擎与 UI 共用）
              src/game/resonanceArc.ts 共鸣电弧绘制
渲染层       src/game/render/renderer.ts  只读 RenderState，输出到 Canvas
```

### 各文件职责

| 文件 | 职责 | 不该放什么 |
|---|---|---|
| `App.tsx` | 界面状态机（title / character_select / playing / paused / levelup / gameover）、持有 `GameEngine` 与摇杆、把 `player` 状态传给 HUD | 游戏数值、碰撞、AI |
| `engine.ts` | 全部可变游戏状态；`update()` 里 17 步固定流水线（技能计时 → Boss 排程 → 移动 → 开火 → 召唤物 → 投射物 → 刷怪 → 敌人 AI → 掉落 → VFX → 相机抖动 → 脱战回复） | 绘制细节（在 renderer）、数值表（在数据层） |
| `render/renderer.ts` | 15 个 `render*` 绘制函数 + `RenderState` 契约 + 辉光贴图缓存 | 任何状态修改 |
| `modes.ts` | `GAME_MODES` 描述表（槽位数、机位间距、出怪倍率、同时存活上限、成长系数、是否合并血条）+ `modeOf` / `modeOfPlayer` / `modeForPilots` / `isPaired` | 模式专属的表现代码（各自写在 UI 里） |
| `characters/<机体>.ts` | 一台机体的**全部**内容：基础属性、被动、主动技、以及它自己的 `drawXxx` 绘制函数 | 运行时状态 |
| `characters/index.ts` | 聚合 `CHARACTERS`、`getCharacterDef`、`drawCharacterShip` | 具体数值 |
| `characters/shipDraw.ts` | 机体绘制共用画笔：`strokeUnit`、`drawNoseCone` | 单个机体的造型 |
| `enemyTypes.ts` | 7 种敌人（含 Boss）的数值表 + 按时间分档的波次权重表 + `enemyHpFor` | 具名刷怪逻辑（在 engine） |
| `upgrades.ts` | 25 条强化：文案、稀有度、`apply(player)`、上限 | 图鉴的额外解说（在 codexData） |
| `player.ts` | `createPlayer`：把选定机体（单机或双机）折算成初始 `Player` | 逐帧状态变更 |
| `pilots.ts` | `hasPilot` / `getTwinPositions` / `getPilotWeaponStats` | 引擎状态读写、模式判定（在 modes） |
| `drones.ts` | 无人机/护卫/轨道炮的射速与伤害算式：`interceptorInterval`、`interceptorShotDamage`、`railgunShotDamage` 等 | 逐帧状态（在 engine） |
| `resonanceArc.ts` | `drawResonanceArc`，双机之间的电弧，游戏内与选人预览共用 | 机体造型（在 characters） |
| `audio.ts` | Web Audio 程序化音效 | 播放时机判断（由引擎调用） |
| `joystick.ts` | 触摸摇杆，暴露归一化 `vector` | — |

## 数据流（一帧）

```
requestAnimationFrame
  → engine.loop(timestamp)
      dt = min(真实间隔, 0.08s) × timeScale        // 倍速在这里生效
      engine.update(dt)                             // 改状态，gameClockMs += dt*1000
      engine.render() → renderScene(ctx, this)       // 只读，画一帧
  → callbacks.onStatsUpdate(player, gameTime, bossWarning)
      → App.setState → HUD 重渲染                  // UI 永远读引擎，不回写
```

两个时钟：`gameTime` 是游戏内秒数（受倍速影响，用于 Boss 排程与敌人成长）；`gameClockMs` 是受倍速影响的毫秒时钟，**所有武器/无人机/技能计时都必须用它**，不要用 `performance.now()`——否则倍速会让射速与移动脱节。真实时钟只用于 `loop()` 里算 `dt`。

## 双子共鸣（Twin Link）模式

- 两机共用一个 `player` 对象（位置、血量、强化等级都是合体状态），左右两个机位由 `getTwinPositions()` 纯函数推出，间距取自 `GAME_MODES.twin_link.wingSpacing`（中心到单侧机位，当前 32px）。
- 副机不是第二份 `player`：它用自己的机体基础属性 + 本次强化增量换算，见 `getPilotWeaponStats(player, 1)`。强化对两机同时生效，但这个换算是唯一的真值来源。
- 模式差异一律从 `modes.ts` 读，不要在别处写 `mode === 'twin_link'`。

## 常见修改任务

### 改动落在哪个文件（速查）

| 你想改的东西 | 唯一该改的文件 |
|---|---|
| 敌人属性、波次权重 | `game/enemyTypes.ts` |
| 机体属性、被动、大招、外观 | `game/characters/<机体>.ts` |
| 强化效果、稀有度、上限 | `game/upgrades.ts` |
| 图鉴专属文案与流派解说 | `game/codexData.ts` |
| 模式的旋钮（出怪倍率、成长系数、血条合并…） | `game/modes.ts` |
| 开局初始状态折算 | `game/player.ts` |
| 双机编队规则、副机数值换算 | `game/pilots.ts` |
| 无人机射速、弹道伤害算式 | `game/drones.ts` |
| 强化逐级数值（冷却/半径/阈值…） | `game/upgrades.ts` 顶部的 `LVL_*` 表 |
| 战斗流程、AI、碰撞、掉落 | `game/engine.ts` |
| 画面表现 | `game/render/renderer.ts` |
| 某个界面长什么样 | `components/` 下对应组件 |
| 界面之间的流转 | `App.tsx` |

反过来用：**如果发现自己要在两个文件里改同一个数值，那就是设计错了**，把真值收拢到数据层。

### 加一台机体
**数据与外观**动 3 个文件，选人界面 / HUD / 暂停面板会自动适配（都走 `getCharacterDef` / `CHARACTERS` 遍历）；但**机制必须自己落到引擎**——`CharacterDef` 只是文案，引擎不认识它：

1. `game/types.ts`：`CharacterId` 联合类型加一项
2. `game/characters/<新机体>.ts`：新建一个文件，导出 `export const xxx: CharacterDef`（基础属性、被动、主动技）**和**它自己的 `export function drawXxx(ctx, radius, angle, time)`，照现有文件抄结构
3. `game/characters/index.ts`：把 def 加进 `CHARACTERS`、把绘制函数加进 `SHIP_DRAWERS`
4. `game/characters/index.test.ts`：把新 id 加进 `EXPECTED_IDS`（数组顺序就是选人界面的排序）
5. ⚠️ **行为**：主动技要在 `engine.ts` 的 `executeCharSkill` 里加一个 `if (charId === '...')` 分支；被动要用 `this.hasPilot('...')` 在引擎里判定（双子模式下任一侧搭载即生效）。被动若需要新状态，把字段加进 `types.ts` 的 `Player`，基值写在 `player.ts`
6. ⚠️ **不要复用共享的 `isSkillActive` 计时器来记一次性的时长**：`player.skillMaxDuration` 取两台机体的较大值，与 δ/γ 组队时会把你的 buff 拉长。要精确时长就自己开一个字段（参考 `chargeTimer`）
7. ⚠️ 若该机体在 `codexData.ts` 里有专属解说（机体目前没有，强化有），记得同步——那里有双份真值

绘制函数一律用 `characters/shipDraw.ts` 的 `strokeUnit(radius)` 取线宽、`drawNoseCone(ctx, radius, angle)` 画机头；不要自己再写 `/18`。机体文件之间不要互相 import。

身份约定（`index.test.ts` 会拦）：`title` 必须是 `四字定位 / 四字机制`，三个名字字段与主色互不重复，`accentColor` 不能等于 `color`；数值上 hp 与 speed 反相关、critChance 与伤害反相关，一台机体只许有一个身份，且要在血量或射速上付代价。

### 加一个模式
模式差异已经收拢在 `game/modes.ts` 的 `GAME_MODES` 表里，**旋钮部分只需要加一行**。剩下的只有"表现"部分需要动代码（这部分无法数据化）：

1. `game/types.ts`：`GameMode` 联合类型加一项
2. `game/modes.ts`：`GAME_MODES` 加一行（槽位数、机位间距、出怪倍率、同时存活上限、成长系数、是否合并血条、名称文案、强调色）。引擎、`player.ts`、HUD、选人界面、开始界面全部自动读表
3. `game/modes.test.ts`：新模式的旋钮断言（表里的 `it('keeps every tuning knob in a sane range')` 会自动覆盖）
4. 只有当新模式需要**专属画面**时才动渲染层：给 `RenderState` 加字段（`renderer.ts` 不判断模式字符串）
5. 表现层按需：`components/StartScreen.tsx` 的模式卡是 map 出来的，加一行数据即可（新强调色要在 `ACCENT_CLASSES` 里补一条）；`components/CharacterSelectScreen.tsx` 的双槽选人、`components/{HUD,PauseModal,GameOverModal}.tsx` 的模式展示位
6. `App.tsx`：若新模式不是"选了第二台机 = 联机"，`modeForPilots` 要跟着调整

对照检查：全仓库 `grep -rn "twin_link" src` 应该只剩 `types.ts` 的联合类型、`modes.ts` 的表与判定、以及测试里的构造调用。出现别处就是漏改了。

### 加一条强化
1. `upgrades.ts` 加一条。`apply(player, lvl)` 的 **`lvl` 是本次授予的等级**（`App.tsx` 在自增前算好传入，`getRandomUpgrades` 的 wrapper 原样转发）——所以**上位等级必须真的产生效果**。
2. 数值怎么放，取决于效果能不能用相对倍率表达：
   - **能**（`damage`、`fire_rate`、`speed`、`magnet`、`shield`…）：直接对 player 字段做乘/加，多级自然叠加，`lvl` 用不到。
   - **不能**（冷却、半径、数量、阈值、目标数这类）：在文件顶部的 `LVL_*` 区加一张逐级表，`apply` 与 `statDiffText` **都从这张表读**，别写第二份。
3. `types.ts` 的 `Player` 加上对应字段（如 `naniteShieldCooldown`），基值写在 `player.ts` 的 `createPlayer` 里，引擎只读字段、不写常量。
4. `codexData.ts` 补上 `levels`（**条数必须等于 `maxLevel`**，`codex.test.ts` 会拦）与 `synergies`（`targetKey` 必须真实存在）。
5. `upgrades.test.ts` 里 `it('changes the player state on each and every rung')` 会自动覆盖新强化：**任何一级没改变 player 状态就会失败**。数值型的再补一条阶梯断言。
6. 强化只改 `player` 字段即可，双子模式会自动分摊到两机。

### 加一种敌人
1. `types.ts` 的 `EnemyType` 联合类型加一项
2. `enemyTypes.ts` 的 `ENEMY_TYPES` 加一行，必要时加进 `SPAWN_BRACKETS`
3. `engine.ts` 的 `updateEnemies` 若需专属 AI，加状态机分支（其他敌人走通用追击）
4. 渲染按 `sides`/颜色自动适配，一般不用改

### 调平衡
数值全部在数据层，不要在 `engine.ts` 里写魔法数。双子模式的成长系数是 `game/modes.ts` 里 `GAME_MODES.twin_link.growthScale`。

## 提交前检查

- [ ] `npm run lint`、`npm run build`、`npm test` 三绿
- [ ] 改了画面/手感/引擎循环：在浏览器里实际玩一遍标准模式与双子模式（**由人来做，助手不要自己去点浏览器**）
- [ ] 没有留下死代码、注释掉的旧实现、未使用的导出
- [ ] 新增数值进了数据表，而不是散落在逻辑里
- [ ] 改了数值：回头对一遍 `codexData.ts` 对应等级的文案（那里的数字是手写的）
- [ ] 提交信息是 Conventional Commits，正文写「为什么」

## 已知技术债

1. **图鉴承诺了、引擎里没有的行为** —— 4 组：`cluster_bombs` 3 级「连锁破片殉爆」、`summon_railgun` 3 级「持续 1 秒的高温电浆裂隙」、`drone_missiles` 3 级「持续范围燃烧震波」、`drone_overclock` 的「无人机命中附加 20% 易伤 / 牺牲飞梭抵挡致命伤 / 12 秒自动重生」。目前这些等级只做到纯数值提升。补齐需要新增持续伤害区、替死判定、重生计时之类的系统——**是加功能，不是修 bug**；动手前先决定补齐还是收敛文案。
2. **图鉴逐级文案里的数字是手写散文** —— `levels[].description` 的绝对数值不由 `upgrades.ts` 的数值表推导，改数值时可能在文案里留下假的数字（已修过 fire_rate 的 250ms 基准、shield 的自愈数值、critical_core 的倍率上限、railgun 的 3.2s、nova 的 2.5s 共 5 处）。
3. **`engine.ts` 仍是单体编排类** —— 敌人 AI 状态机、碰撞、掉落仍在其中。已在渲染层（`render/renderer.ts`）、机体数据（`characters/`）、模式旋钮（`modes.ts`）、玩家构造（`player.ts`）、无人机算式（`drones.ts`）做过拆分，后续若继续拆分，建议顺序：敌人 AI → 碰撞/伤害 → 掉落与经验。
4. **测试覆盖不全** —— 只覆盖纯函数模块（`npm test`）。引擎循环与渲染需要 canvas，仍只能靠手玩。
5. **`PauseModal` 残留硬编码** —— 如轨道炮「贯穿 5 敌」的 5 与引擎里的 `pierce: 5` 是两份。无人机算式已收进 `drones.ts` 共用，同类数字遇到就顺手收拢。
6. **3× 倍速下单帧步长最大 0.24s** —— 位移约 63px/帧，极快的敌人理论上可能穿过碰撞判定。若要消除需引入子步进。
