# AGENTS.md

几何超载（Geometric Overload）——纯几何肉鸽割草生存。Vite + React + TypeScript，无外部美术资源，所有图形由 Canvas 2D 程序化绘制。

本文件是给编码助手（以及人）看的硬约束。改代码前先读完，改完必须满足「验证门」。

## 验证门（每次改动都必须过）

```bash
npm run lint    # tsc --noEmit，必须 0 错
npm run build   # vite build，必须成功
npm test        # vitest，必须全绿
```

三绿之前不要声称完成。涉及画面或手感的改动，还要在 `npm run dev`（端口 3000）里实际玩一遍确认——**这一步由人来做，编码助手不要自己去点浏览器**。引擎循环有 headless 回归（`engineLoop.test.ts`），但它不比对数值、也不看画面；需要特定敌人状态时用 dev 环境的**测试场**（见 `docs/CONTRIBUTING.md`）。

## 硬约束

1. **不允许留下半成品。** 这是本仓库出现过的最严重问题：`weapons.ts` / `lab.ts` / `LabModal.tsx` / `ChestModal.tsx` 共 670 行死代码，引用 `core/types.ts` 里根本不存在的类型，导致 `npm run lint` 长期失败——真正的错误因此被淹没。做不到就回退，不要提交引用了不存在符号的文件。

2. **删功能要连文件一起删。** 不要注释掉旧实现，不要留 `// removed`。git 会替你记住。

3. **数值只写一处。** 敌人属性 → `src/game/core/enemyTypes.ts`；机体 → `src/game/characters/<机体>.ts`；强化 → `src/game/cards/upgrades.ts`（溢流模式专属卡 → `src/game/cards/overflowUpgrades.ts`，两池的 key 必须全局唯一，因为共用一个 `upgradeLevels`）；模式差异 → `src/game/core/modes.ts`。新增敌人 = 表里加一行，不要写 if-else 分支。发现自己要在两个文件改同一个数值，就是设计错了。

4. **加内容前先查清单。** `docs/CONTRIBUTING.md` 有「改动落在哪个文件」速查表，以及加机体 / 加强化 / 加敌人 / **加模式**四份逐文件清单。四类里只有加模式还需要动多处（模式的表现部分），必须照着走。

5. **UI 不许重新推导游戏规则。** HUD / Modal 只能展示引擎或共享模块算出来的值。历史上 `PauseModal` 自己算过 carrier 倍率和无人机 DPS，引擎改判定后它就悄悄错了。需要什么就导出纯函数（见约束 6）。

6. **共享规则放纯函数模块。** 模式旋钮与 `isPaired` 在 `src/game/core/modes.ts`；双机编队与副机属性换算在 `src/game/core/pilots.ts`；机体几何外观与共鸣电弧在 `src/game/characters/` 与 `src/game/render/resonanceArc.ts`（引擎与选人界面共用一份）。禁止在两个地方各写一遍同样的规则。

7. **渲染只读。** `src/game/render/renderer.ts` 只能通过 `RenderState` 读取状态，不得修改任何游戏状态、不得 push 数组，也不要判断模式字符串（靠 `getTwinPositions` 在单机时自然退化）。要画新东西就给 `RenderState` 加字段。

8. **引擎是唯一状态源。** 不要在 React 组件里保存游戏状态副本并回写引擎；`App.tsx` 只做状态机与传参。

9. **提交信息用 Conventional Commits**（`feat:` / `fix:` / `refactor:` / `test:` / `docs:` / `chore:`），正文说明「为什么」。不要加 AI 署名尾巴。重构切片与它的测试放在同一个提交里。

10. **引擎按「纯规则 / 编排」分层。** `engine/index.ts` 只放可变状态、`update()` 流水线与副作用（音效、粒子、震屏、回调）；不带副作用的判断与算式放 `engine/<领域>.ts`（样板：`enemyAi` 决策、`collision` 命中、`damage` 伤害、`drops` 收益与经验）。纯模块不 import 引擎、不碰 DOM，入参用 `Pick<>` 收窄，模块内常量是唯一真值，并且必须配 `__tests__/<领域>.test.ts`。迁移逻辑属于**行为不变**的重构：数值与公式原样搬，已知怪癖用测试钉住并写进交付说明，不顺手改玩法。完整流程见 `docs/CONTRIBUTING.md` 的「引擎开发范式」。

## 目录速查

```
src/
  App.tsx                 状态机 + 引擎/UI 编排
  components/             UI 层（8 个界面/弹窗，含仅开发环境的测试场面板），不算游戏规则
  game/
    engine/               编排层
      index.ts              全部游戏状态 + update 流水线
      enemyAi.ts            sniper / charger / boss 的决策状态机（纯逻辑，有单测）
      collision.ts          玩家弹 / 敌弹 / 接触的命中判定（纯几何，有单测）
      damage.ts             状态易伤与护盾减伤（纯算式，有单测）
      drops.ts              击杀得分、晶石掉落规格、经验曲线、拾取速度（纯数值，有单测）
    core/                 共享的模型与规则，引擎 / UI / 测试都读它
      types.ts              共享类型
      modes.ts              游戏模式描述表（模式差异的唯一来源）
      pilots.ts             双机编队 / 副机属性换算
      player.ts             开局玩家状态构造（合体属性在这里算）
      enemyTypes.ts         7 种敌人数据表 + 波次表
    cards/                卡牌子系统（一张卡的数据与图鉴文案）
      upgrades.ts           标准池 25 条强化数据表（+ atLevel 逐级取值）
      overflowUpgrades.ts   溢流模式专属卡池 25 张（独立表，数值不讲等价）
      upgradePools.ts       卡池分发与跨池查表（poolForMode / findUpgrade）
      codexData.ts          图鉴文案（逐级数值是手写散文，改数值时要回头对一遍）
    systems/              一卡一系统的纯数值与算式，一律有单测
      drones.ts  turrets.ts  clones.ts  allies.ts
      shotEcho.ts  riftLance.ts  gridVerdict.ts
      （棱镜炮台 / 镜像分身 / 亡者编队 / 射击回响 / 裂空光矛 / 网格裁决）
    infra/                与玩法无关的基础设施
      audio.ts              程序化音效
      joystick.ts           触摸摇杆
    render/               全部绘制，只读 RenderState
      renderer.ts           绘制 pass（只读 RenderState）
      friendlyMarker.ts     我方单位的统一标记（炮台/分身/友军共用一枚环）
      resonanceArc.ts       双子共鸣电弧绘制（引擎与选人界面共用）
    characters/           10 台机体，一台一个文件（数值 + 外观）
      index.ts              聚合 CHARACTERS / getCharacterDef / drawCharacterShip
      shipDraw.ts           机体绘制共用画笔（线宽单位、机头）
    __tests__/            纯函数模块的行为测试（vitest，node 环境），与源码分开放
```

## 已知技术债

**图鉴承诺了、引擎里没有的行为**（文案不能删也还没实现，动这块之前先决定「补上」还是「收敛文案」）：

- `cluster_bombs` 3 级「连锁破片殉爆」——目前第 3 级只做到破片 3→4 枚。
- `summon_railgun` 3 级「持续 1 秒的高温电浆裂隙」——目前只做到冷却 1.8s 与激光宽度 ×2。
- `drone_missiles` 3 级「持续范围燃烧震波」——目前只做到发射间隔 1.8s。
- `drone_overclock` 的「无人机命中附加 20% 易伤」「牺牲飞梭抵挡致命伤」「12 秒自动重生」——三条都未实现。

这些都要新增持续伤害区 / 替死判定 / 重生计时之类的系统，属于新功能，不是修 bug。

**图鉴的逐级数值仍是手写散文**：`cards/codexData.ts` 的 `levels[].description` 里含绝对数值（如「冷却缩短至 3.2s」），不由 `cards/upgrades.ts` 的数值表推导。名称已经改成现查（`synergyLabel`），但**文案里的数字仍可能与数值表漂移**——改数值时必须回头对一遍文案，或者把文案也改成从表推导。

- `engine/index.ts` 仍是大的编排类（2026-10 实测 3540 行，约占 `src/` 全部代码 1/4），但纯规则已基本搬空：敌人决策在 `engine/enemyAi.ts`，命中与伤害算式在 `engine/collision.ts` / `engine/damage.ts`，掉落规格、经验曲线与拾取速度在 `engine/drops.ts`，四者都是纯逻辑、有单测。索敌、分离、击杀编排、晶石移动与升级入口仍留在循环里。文件内的 3 条分区横幅中，「SUMMONS & DRONES LOGIC」底下其实装着投射物、掉落与击杀。
- 测试覆盖纯函数模块（数值表、换算、模式旋钮、算式）。**`engine/index.ts` 的循环现在有一条 headless 回归**（`__tests__/engineLoop.test.ts` + `headlessEngine.ts`）：用桩 canvas、桩时钟和固定种子的随机数驱动真实引擎，逐帧检查「无 NaN / 不出界 / 不破上限」，并断言击杀·伤害·等级只会单调上升、各召唤系统真的启动、同种子可复现。它**不比对具体数值**（那需要内嵌黄金轨迹），所以数值漂移仍要靠手感；`renderer.ts` 只有一条**结构性**测试（每个绘制步骤都被 `renderScene` 调用、pass 编号连续），不验证画面正确性。要盯着某一类敌人看时，用 dev 环境的**测试场**模式（标题界面最后一张模式卡）：不自动刷怪，右侧面板手动生成 1/5/20 只、清场、开关无敌；它在生产构建里会被过滤掉。
- `PauseModal` 里还留着个别硬编码（如轨道炮「贯穿 5 敌」的 5）。无人机相关的算式已经收进 `game/systems/drones.ts` 共用，其余同类数字遇到就顺手收拢。

详细说明（数据流、常见修改任务清单）见 `docs/CONTRIBUTING.md`。
