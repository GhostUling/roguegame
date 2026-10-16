# AGENTS.md

几何超载（Geometric Overload）——纯几何肉鸽割草生存。Vite + React + TypeScript，无外部美术资源，所有图形由 Canvas 2D 程序化绘制。

本文件是给编码助手（以及人）看的硬约束。改代码前先读完，改完必须满足「验证门」。

## 验证门（每次改动都必须过）

```bash
npm run lint    # tsc --noEmit，必须 0 错
npm run build   # vite build，必须成功
npm test        # vitest，必须全绿
```

三绿之前不要声称完成。涉及画面或手感的改动，还要在 `npm run dev`（端口 3000）里实际玩一遍确认——**这一步由人来做，编码助手不要自己去点浏览器**。

## 硬约束

1. **不允许留下半成品。** 这是本仓库出现过的最严重问题：`weapons.ts` / `lab.ts` / `LabModal.tsx` / `ChestModal.tsx` 共 670 行死代码，引用 `types.ts` 里根本不存在的类型，导致 `npm run lint` 长期失败——真正的错误因此被淹没。做不到就回退，不要提交引用了不存在符号的文件。

2. **删功能要连文件一起删。** 不要注释掉旧实现，不要留 `// removed`。git 会替你记住。

3. **数值只写一处。** 敌人属性 → `src/game/enemyTypes.ts`；机体 → `src/game/characters/<机体>.ts`；强化 → `src/game/upgrades.ts`（溢流模式专属卡 → `src/game/overflowUpgrades.ts`，两池的 key 必须全局唯一，因为共用一个 `upgradeLevels`）；模式差异 → `src/game/modes.ts`。新增敌人 = 表里加一行，不要写 if-else 分支。发现自己要在两个文件改同一个数值，就是设计错了。

4. **加内容前先查清单。** `docs/CONTRIBUTING.md` 有「改动落在哪个文件」速查表，以及加机体 / 加强化 / 加敌人 / **加模式**四份逐文件清单。四类里只有加模式还需要动多处（模式的表现部分），必须照着走。

5. **UI 不许重新推导游戏规则。** HUD / Modal 只能展示引擎或共享模块算出来的值。历史上 `PauseModal` 自己算过 carrier 倍率和无人机 DPS，引擎改判定后它就悄悄错了。需要什么就导出纯函数（见约束 6）。

6. **共享规则放纯函数模块。** 模式旋钮与 `isPaired` 在 `src/game/modes.ts`；双机编队与副机属性换算在 `src/game/pilots.ts`；机体几何外观与共鸣电弧在 `src/game/characters/` 与 `src/game/resonanceArc.ts`（引擎与选人界面共用一份）。禁止在两个地方各写一遍同样的规则。

7. **渲染只读。** `src/game/render/renderer.ts` 只能通过 `RenderState` 读取状态，不得修改任何游戏状态、不得 push 数组，也不要判断模式字符串（靠 `getTwinPositions` 在单机时自然退化）。要画新东西就给 `RenderState` 加字段。

8. **引擎是唯一状态源。** 不要在 React 组件里保存游戏状态副本并回写引擎；`App.tsx` 只做状态机与传参。

9. **提交信息用 Conventional Commits**（`feat:` / `fix:` / `refactor:` / `docs:` / `chore:`），正文说明「为什么」。不要加 AI 署名尾巴。

## 目录速查

```
src/
  App.tsx                 状态机 + 引擎/UI 编排
  components/             UI 层（7 个界面/弹窗），不算游戏规则
  game/
    engine.ts             编排层：状态 + update 流水线
    render/renderer.ts    全部绘制，只读 RenderState
    types.ts              共享类型
    modes.ts              游戏模式描述表（模式差异的唯一来源）
    characters/           10 台机体，一台一个文件（数值 + 外观）
      index.ts              聚合 CHARACTERS / getCharacterDef / drawCharacterShip
      shipDraw.ts           机体绘制共用画笔（线宽单位、机头）
    enemyTypes.ts         7 种敌人数据表 + 波次表
    upgrades.ts           标准池 25 条强化数据表（+ atLevel 逐级取值）
    overflowUpgrades.ts   溢流模式专属卡池 18 张（独立表，数值不讲等价）
    upgradePools.ts       卡池分发与跨池查表（poolForMode / findUpgrade）
    player.ts             开局玩家状态构造（合体属性在这里算）
    pilots.ts             双机编队 / 副机属性换算
    resonanceArc.ts       双子共鸣电弧绘制
    codexData.ts          图鉴文案（逐级数值是手写散文，改数值时要回头对一遍）
    audio.ts              程序化音效
    joystick.ts           触摸摇杆
    __tests__/            纯函数模块的行为测试（vitest，node 环境），与源码分开放
```

## 已知技术债

**图鉴承诺了、引擎里没有的行为**（文案不能删也还没实现，动这块之前先决定「补上」还是「收敛文案」）：

- `cluster_bombs` 3 级「连锁破片殉爆」——目前第 3 级只做到破片 3→4 枚。
- `summon_railgun` 3 级「持续 1 秒的高温电浆裂隙」——目前只做到冷却 1.8s 与激光宽度 ×2。
- `drone_missiles` 3 级「持续范围燃烧震波」——目前只做到发射间隔 1.8s。
- `drone_overclock` 的「无人机命中附加 20% 易伤」「牺牲飞梭抵挡致命伤」「12 秒自动重生」——三条都未实现。

这些都要新增持续伤害区 / 替死判定 / 重生计时之类的系统，属于新功能，不是修 bug。

**图鉴的逐级数值仍是手写散文**：`codexData.ts` 的 `levels[].description` 里含绝对数值（如「冷却缩短至 3.2s」），不由 `upgrades.ts` 的数值表推导。名称已经改成现查（`synergyLabel`），但**文案里的数字仍可能与数值表漂移**——改数值时必须回头对一遍文案，或者把文案也改成从表推导。

- `engine.ts` 仍是单个约 2000 行编排类，敌人 AI 状态机、碰撞、掉落都在里面，尚未按域拆分。
- 测试只覆盖纯函数模块（数值表、换算、模式旋钮、无人机算式）。`engine.ts` 的循环与 `renderer.ts` 需要 canvas，仍无自动化回归，只能靠手玩。
- `PauseModal` 里还留着个别硬编码（如轨道炮「贯穿 5 敌」的 5）。无人机相关的算式已经收进 `game/drones.ts` 共用，其余同类数字遇到就顺手收拢。

详细说明（数据流、常见修改任务清单）见 `docs/CONTRIBUTING.md`。
