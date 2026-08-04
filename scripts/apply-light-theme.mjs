import { readFileSync, writeFileSync } from "node:fs";

const path = "src/ui.ts";
let source = readFileSync(path, "utf8");

source = source.replace(
  `    radial-gradient(circle at 82% 4%,#5536c638 0,transparent 30rem),
    radial-gradient(circle at 12% 20%,#245bca2f 0,transparent 34rem),
    linear-gradient(#ffffff06 1px,transparent 1px),
    linear-gradient(90deg,#ffffff06 1px,transparent 1px),
    var(--bg);
  background-size:auto,auto,56px 56px,56px 56px,auto;`,
  `    radial-gradient(circle at 85% 0%,#dbeafe 0,transparent 28rem),
    radial-gradient(circle at 10% 18%,#ede9fe 0,transparent 32rem),
    var(--bg);`,
);

source = source.replaceAll(
  "border-color:#ffffff19",
  "border-color:var(--line)",
);
source = source.replaceAll("#c6d0ff", "var(--link)");
source = source.replaceAll("#dbe3ff", "var(--text)");
source = source.replaceAll("#8aa4ff", "var(--link)");
source = source.replaceAll("#8e99ba", "var(--muted)");
source = source.replaceAll("#aabbdd", "var(--muted)");
source = source.replaceAll(
  ".brand{display:inline-flex;align-items:center;gap:8px;font-size:21px}",
  ".brand{display:inline-flex;align-items:center;gap:8px;font-size:21px;color:var(--text);text-decoration:none}",
);
source = source.replace(
  ".brand::before{content:\"\";width:11px;height:25px;border-radius:3px;background:linear-gradient(180deg,var(--brand),var(--brand-2));box-shadow:0 0 28px #6f8cff70}",
  ".brand::before{content:\"\";width:11px;height:25px;border-radius:3px;background:linear-gradient(180deg,var(--brand),var(--accent));box-shadow:0 0 18px #2563eb33}",
);
source = source.replace(
  ".brand small{color:#aebcff;",
  ".brand small{color:var(--accent);",
);
source = source.replaceAll(
  "border:1px solid #2b355b;border-radius:12px;background:#0b1123",
  "border:1px solid var(--line);border-radius:12px;background:var(--surface-muted)",
);
source = source.replaceAll(
  "border:1px solid #2b355b;border-radius:14px;padding:16px;margin-bottom:20px;background:#0b1123",
  "border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:20px;background:var(--surface-muted)",
);
source = source.replaceAll(
  "border:1px solid #303a5d;border-radius:12px;padding:14px 16px;margin:16px 0;background:#0b1123",
  "border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:16px 0;background:var(--surface-muted)",
);
source = source.replaceAll(
  ".guard-qr-wrap img{border:1px solid #334065;border-radius:12px;background:#060817;padding:8px}",
  ".guard-qr-wrap img{border:1px solid var(--line);border-radius:12px;background:#fff;padding:8px}",
);
source = source.replace(
  ".guard-cta{margin:28px 0;padding:28px;border:1px solid #2b355b;border-radius:16px;background:linear-gradient(145deg,#111831e8,#090d1ee8);text-align:center}",
  ".guard-cta{margin:28px 0;padding:28px;border:1px solid var(--line);border-radius:16px;background:var(--panel);box-shadow:var(--shadow);text-align:center}",
);
source = source.replace(
  ".guard-cta h2{margin:10px 0 8px;font-size:clamp(28px,4vw,40px)}",
  ".guard-cta h2{margin:10px 0 8px;font-size:clamp(28px,4vw,40px);color:var(--text)}",
);
source = source.replace(
  ".guard-cta-highlight{border-color:#667de0;box-shadow:0 0 0 1px #667de0,0 18px 50px #6f8cff22}",
  ".guard-cta-highlight{border-color:#93c5fd;box-shadow:0 0 0 1px #93c5fd,var(--shadow)}",
);
source = source.replace(
  ".guard-cta-verified{border-color:var(--success);box-shadow:0 0 0 1px #55d6a7,0 18px 50px #55d6a733;background:linear-gradient(145deg,#102318e8,#0a1218e8)}",
  ".guard-cta-verified{border-color:var(--success);box-shadow:0 0 0 1px #34d399,var(--shadow);background:linear-gradient(145deg,#ecfdf5,#ffffff)}",
);
source = source.replace(
  ".guard-cta-verified .step{color:#7dffb8}",
  ".guard-cta-verified .step{color:#047857}",
);
source = source.replace(
  ".guard-cta-verified h2{color:#d7ffe8}",
  ".guard-cta-verified h2{color:#065f46}",
);
source = source.replace(
  ".wallet-picker-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:#02040ccc;backdrop-filter:blur(4px)}",
  ".wallet-picker-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:#0f172a66;backdrop-filter:blur(4px)}",
);
source = source.replace(
  ".wallet-picker-dialog{width:min(420px,calc(100vw - 32px));padding:24px;border:1px solid #334065;border-radius:18px;background:#0d1228;box-shadow:0 24px 80px #0008}",
  ".wallet-picker-dialog{width:min(420px,calc(100vw - 32px));padding:24px;border:1px solid var(--line);border-radius:18px;background:var(--panel);box-shadow:var(--shadow-lg)}",
);
source = source.replace(
  ".wallet-picker-dialog h2{margin:0 0 8px;font-size:24px}",
  ".wallet-picker-dialog h2{margin:0 0 8px;font-size:24px;color:var(--text)}",
);
source = source.replace(
  ".wallet-picker-option{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:1px solid #334065;border-radius:12px;background:#0b1123;color:var(--text);cursor:pointer;text-align:left}",
  ".wallet-picker-option{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface-muted);color:var(--text);cursor:pointer;text-align:left}",
);
source = source.replace(
  ".wallet-picker-option:hover{border-color:#667de0;box-shadow:0 0 0 1px #667de044}",
  ".wallet-picker-option:hover{border-color:#93c5fd;box-shadow:0 0 0 1px #93c5fd44}",
);
source = source.replace(
  ".wallet-picker-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:#151e3e;color:#dbe3ff;font-weight:800;overflow:hidden;flex:none}",
  ".wallet-picker-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-weight:800;overflow:hidden;flex:none}",
);
source = source.replace(
  ".nav-wallet-btn:hover,#nav-connect:hover,#w-btn:hover{box-shadow:0 4px 15px #6f8cff55}",
  ".nav-wallet-btn:hover,#nav-connect:hover,#w-btn:hover{box-shadow:0 4px 15px #2563eb44}",
);
source = source.replace(
  ".nav-menu-toggle{display:none;background:#151e3e;border:1px solid #3b4a79;color:#dbe3ff;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}",
  ".nav-menu-toggle{display:none;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}",
);
source = source.replace(
  ".wallet-status-dot{width:10px;height:10px;border-radius:50%;background:#555;flex:none}",
  ".wallet-status-dot{width:10px;height:10px;border-radius:50%;background:#94a3b8;flex:none}",
);
source = source.replace(
  ".route-action-link{box-shadow:0 10px 35px #0004}",
  ".route-action-link{box-shadow:var(--shadow)}",
);
source = source.replace(
  ".route-readiness.neutral{border-color:#344273}",
  ".route-readiness.neutral{border-color:#cbd5e1}",
);
source = source.replace(
  ".route-readiness.allow{border-color:var(--success)}",
  ".route-readiness.allow{border-color:var(--success);background:#ecfdf5}",
);
source = source.replace(
  ".route-readiness.review{border-color:#ba91ff}",
  ".route-readiness.review{border-color:#c4b5fd;background:#faf5ff}",
);
source = source.replace(
  ".footer-social a:hover{color:#fff}",
  ".footer-social a:hover{color:var(--brand)}",
);
source = source.replace(
  ".chain-network-label{font-size:13px;font-weight:700;color:#c6d0ff}",
  ".chain-network-label{font-size:13px;font-weight:700;color:var(--muted)}",
);
source = source.replace(
  ".builder-advanced summary{cursor:pointer;color:#c6d0ff;font-weight:700}",
  ".builder-advanced summary{cursor:pointer;color:var(--text);font-weight:700}",
);

writeFileSync(path, source);
console.log("Light theme CSS applied.");
