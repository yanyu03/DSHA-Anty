import os
import sys
import json
import time
import threading
from datetime import datetime, timezone, timedelta

# Fix Windows Tkinter High-DPI blurriness before importing/initializing Tk
import ctypes
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except Exception:
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

import tkinter as tk
from http.server import HTTPServer, BaseHTTPRequestHandler

CONFIG_PATH = os.environ.get('DSHA_METER_CONFIG') or os.path.join(os.path.dirname(os.path.abspath(__file__)), "meter_config.json")
DEFAULT_CONFIG = {
    "limits": {
        "5h_request_limit": 200,
        "5h_token_limit": 1000000,
        "7d_request_limit": 1500,
        "7d_token_limit": 10000000,
        "context_window_limit": 1000000
    },
    "ui": {
        "always_on_top": True,
        "alpha": 0.96,
        "refresh_seconds": 1,
        "mode": "full"
    }
}

FONT_FAMILY = "Microsoft YaHei UI"

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_CONFIG

def get_telemetry():
    brain_dir = os.environ.get('DSHA_BRAIN_DIR') or os.path.expanduser(r"~\.gemini\antigravity\brain")
    now = datetime.now(timezone.utc)
    five_hours_ago = now - timedelta(hours=5)
    seven_days_ago = now - timedelta(days=7)

    stats = {
        "5h_requests": 0,
        "5h_tokens": 0,
        "5h_cached_tokens": 0,
        "7d_requests": 0,
        "7d_tokens": 0,
        "7d_cached_tokens": 0,
        "current_context_tokens": 0,
        "last_step_output_tokens": 0,
        "total_steps": 0,
        "latest_model": "Gemini 3.8 Flash (High)",
        "active_cid": "",
        "5h_next_recover_seconds": 0,
        "5h_next_recover_tokens": 0,
        "5h_full_recover_seconds": 0,
        "7d_next_recover_seconds": 0,
        "7d_next_recover_tokens": 0,
        "7d_full_recover_seconds": 0,
    }

    if not os.path.exists(brain_dir):
        return stats

    presence_dir = os.environ.get('DSHA_PRESENCE_DIR') or os.path.expanduser(r"~\.gemini\antigravity\presence")
    active_cid = ""
    if os.path.exists(presence_dir):
        for f in os.listdir(presence_dir):
            if f.endswith(".lock"):
                active_cid = f[:-5]
                break
    stats["active_cid"] = active_cid

    records_5h = []
    records_7d = []

    for cid in os.listdir(brain_dir):
        t_path = os.path.join(brain_dir, cid, ".system_generated", "logs", "transcript.jsonl")
        if not os.path.exists(t_path):
            continue
        try:
            with open(t_path, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        step = json.loads(line)
                    except Exception:
                        continue
                    created_at_str = step.get("created_at")
                    if not created_at_str:
                        continue

                    clean_ts = created_at_str.split(".")[0]
                    if clean_ts.endswith("Z"):
                        clean_ts = clean_ts[:-1]
                    try:
                        step_time = datetime.fromisoformat(clean_ts).replace(tzinfo=timezone.utc)
                    except Exception:
                        continue

                    inp = step.get("input_tokens", 0) or 0
                    out = step.get("output_tokens", 0) or 0
                    cache = step.get("cache_read_tokens", 0) or 0
                    toks = inp + out

                    stats["total_steps"] += 1

                    if step_time >= seven_days_ago:
                        if step.get("type") == "PLANNER_RESPONSE":
                            stats["7d_requests"] += 1
                        stats["7d_tokens"] += toks
                        stats["7d_cached_tokens"] += cache
                        if toks > 0:
                            records_7d.append((step_time, toks))

                    if step_time >= five_hours_ago:
                        if step.get("type") == "PLANNER_RESPONSE":
                            stats["5h_requests"] += 1
                        stats["5h_tokens"] += toks
                        stats["5h_cached_tokens"] += cache
                        if toks > 0:
                            records_5h.append((step_time, toks))

                    if cid == active_cid or not active_cid:
                        if inp or cache:
                            stats["current_context_tokens"] = inp + cache
                            stats["last_step_output_tokens"] = out
        except Exception:
            pass

    # 5H calculations
    if records_5h:
        records_5h.sort(key=lambda x: x[0])
        earliest_5h = records_5h[0][0]
        latest_5h = records_5h[-1][0]
        next_5h_time = earliest_5h + timedelta(hours=5)
        full_5h_time = latest_5h + timedelta(hours=5)

        stats["5h_next_recover_seconds"] = max(0, int((next_5h_time - now).total_seconds()))
        stats["5h_next_recover_tokens"] = records_5h[0][1]
        stats["5h_full_recover_seconds"] = max(0, int((full_5h_time - now).total_seconds()))

    # 7D calculations
    if records_7d:
        records_7d.sort(key=lambda x: x[0])
        earliest_7d = records_7d[0][0]
        latest_7d = records_7d[-1][0]
        next_7d_time = earliest_7d + timedelta(days=7)
        full_7d_time = latest_7d + timedelta(days=7)

        stats["7d_next_recover_seconds"] = max(0, int((next_7d_time - now).total_seconds()))
        stats["7d_next_recover_tokens"] = records_7d[0][1]
        stats["7d_full_recover_seconds"] = max(0, int((full_7d_time - now).total_seconds()))

    return stats

def fmt_tokens(n):
    if n >= 1_000_000:
        return f"{n/1_000_000:.2f}M"
    if n >= 1_000:
        return f"{n/1_000:.1f}k"
    return str(n)

def fmt_countdown(sec):
    if sec <= 0:
        return "即将刷新"
    d = sec // 86400
    rem = sec % 86400
    h = rem // 3600
    m = (rem % 3600) // 60
    s = rem % 60
    if d > 0:
        return f"{d}天 {h:02d}h {m:02d}m"
    if h > 0:
        return f"{h:02d}h {m:02d}m {s:02d}s"
    return f"{m:02d}m {s:02d}s"

GLOBAL_STATS = {}

class LocalHttpHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/stats":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(GLOBAL_STATS).encode("utf-8"))
        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            next_5h = fmt_countdown(GLOBAL_STATS.get('5h_next_recover_seconds', 0))
            full_5h = fmt_countdown(GLOBAL_STATS.get('5h_full_recover_seconds', 0))
            next_7d = fmt_countdown(GLOBAL_STATS.get('7d_next_recover_seconds', 0))
            html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="2">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-[#121214] text-[#f4f4f5] p-4 font-sans text-xs">
  <div class="border border-[#2e2e36] rounded-xl p-3 bg-[#1c1c20] max-w-sm mx-auto shadow-2xl">
    <div class="flex justify-between items-center mb-2">
      <span class="font-bold text-sky-400">✦ DSHA · 动态刷新额度雷达</span>
      <span class="text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/50">清晰高分屏</span>
    </div>
    <div class="space-y-2.5">
      <div class="bg-[#121214] p-2.5 rounded-lg border border-[#2e2e36]">
        <div class="flex justify-between text-[#a1a1aa] text-[10px] mb-0.5">
          <span>当前上下文 (已用/总额)</span>
          <span class="text-sky-400 font-bold">{GLOBAL_STATS.get('current_context_tokens', 0)/10000:.1f}%</span>
        </div>
        <div class="font-bold text-sm text-sky-300">{fmt_tokens(GLOBAL_STATS.get('current_context_tokens', 0))} / 1.0M</div>
        <div class="text-[10px] text-[#71717a] mt-1">余量: {fmt_tokens(max(0, 1000000 - GLOBAL_STATS.get('current_context_tokens', 0)))} · /compact 可重置</div>
      </div>
      <div class="bg-[#121214] p-2.5 rounded-lg border border-[#2e2e36]">
        <div class="flex justify-between text-[#a1a1aa] text-[10px] mb-0.5">
          <span>5H 滚动配额 (动态回血)</span>
          <span class="text-amber-400 font-bold">{GLOBAL_STATS.get('5h_tokens', 0)/10000:.1f}%</span>
        </div>
        <div class="font-bold text-sm text-amber-300">{fmt_tokens(GLOBAL_STATS.get('5h_tokens', 0))} / 1.0M</div>
        <div class="text-[10px] text-amber-300 mt-1 font-mono">⏱ 下次回血: {next_5h} (+{fmt_tokens(GLOBAL_STATS.get('5h_next_recover_tokens', 0))})</div>
        <div class="text-[10px] text-[#71717a]">⏳ 完全回满: {full_5h}</div>
      </div>
      <div class="bg-[#121214] p-2.5 rounded-lg border border-[#2e2e36]">
        <div class="flex justify-between text-[#a1a1aa] text-[10px] mb-0.5">
          <span>7D 周度总配额 (周倒计时)</span>
          <span class="text-purple-400 font-bold">{GLOBAL_STATS.get('7d_tokens', 0)/100000:.1f}%</span>
        </div>
        <div class="font-bold text-sm text-purple-300">{fmt_tokens(GLOBAL_STATS.get('7d_tokens', 0))} / 10.0M</div>
        <div class="text-[10px] text-purple-300 mt-1 font-mono">🗓 周额度刷新倒计时: {next_7d}</div>
        <div class="text-[10px] text-[#71717a]">缓存复用: {fmt_tokens(GLOBAL_STATS.get('7d_cached_tokens', 0))} tok</div>
      </div>
    </div>
  </div>
</body>
</html>"""
            self.wfile.write(html.encode("utf-8"))

    def log_message(self, format, *args):
        pass

def start_http_server():
    try:
        address = os.environ.get('DSHA_METER_HOST', '127.0.0.1')
        port = int(os.environ.get('DSHA_METER_PORT', '48123'))
        # Telemetry must remain local even when an environment override is supplied.
        if address not in ('127.0.0.1', '::1') or not 0 <= port <= 65535:
            raise ValueError('Invalid local meter endpoint')
        with HTTPServer((address, port), LocalHttpHandler) as server:
            server.serve_forever()
    except (OSError, ValueError):
        print('[DSHA-Meter] Local server unavailable; check DSHA_METER_HOST/DSHA_METER_PORT', file=sys.stderr)

class DshaMeterApp:
    def __init__(self, root):
        self.root = root
        self.config = load_config()
        self.mode = self.config["ui"].get("mode", "full")
        self.always_on_top = self.config["ui"].get("always_on_top", True)
        self.drag_start_x = 0
        self.drag_start_y = 0

        self.root.title("DSHA · 动态刷新额度与Token雷达")
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", self.always_on_top)
        self.root.attributes("-alpha", self.config["ui"].get("alpha", 0.96))
        self.root.configure(bg="#121214")

        sw = self.root.winfo_screenwidth()
        self.win_width = 390
        self.win_height = 345
        init_x = sw - self.win_width - 24
        init_y = 28
        self.root.geometry(f"{self.win_width}x{self.win_height}+{init_x}+{init_y}")

        self.root.bind("<Button-1>", self.start_drag)
        self.root.bind("<B1-Motion>", self.do_drag)
        self.root.bind("<Double-Button-1>", lambda e: self.toggle_mode())

        self.setup_ui()

        self.menu = tk.Menu(self.root, tearoff=0, bg="#1c1c20", fg="#ffffff", activebackground="#3b82f6", font=(FONT_FAMILY, 9))
        self.menu.add_command(label="切换 详细面板 / 极简胶囊", command=self.toggle_mode)
        self.menu.add_command(label="切换 窗口置顶", command=self.toggle_topmost)
        self.menu.add_separator()
        self.menu.add_command(label="退出", command=self.root.destroy)
        self.root.bind("<Button-3>", self.show_context_menu)

        self.running = True
        self.poll_loop()

    def start_drag(self, event):
        self.drag_start_x = event.x
        self.drag_start_y = event.y

    def do_drag(self, event):
        x = self.root.winfo_x() + (event.x - self.drag_start_x)
        y = self.root.winfo_y() + (event.y - self.drag_start_y)
        self.root.geometry(f"+{x}+{y}")

    def show_context_menu(self, event):
        self.menu.post(event.x_root, event.y_root)

    def toggle_topmost(self):
        self.always_on_top = not self.always_on_top
        self.root.attributes("-topmost", self.always_on_top)

    def toggle_mode(self):
        if self.mode == "full":
            self.mode = "capsule"
            self.detail_frame.pack_forget()
            self.capsule_frame.pack(fill="both", expand=True)
            self.root.geometry("380x56")
        else:
            self.mode = "full"
            self.capsule_frame.pack_forget()
            self.detail_frame.pack(fill="both", expand=True)
            self.root.geometry(f"{self.win_width}x{self.win_height}")

    def draw_progress(self, canvas, pct, color="#38bdf8", bg_color="#242429"):
        canvas.delete("all")
        w = canvas.winfo_width()
        h = canvas.winfo_height()
        if w < 10: w = 350
        if h < 4: h = 6
        canvas.create_rectangle(0, 0, w, h, fill=bg_color, width=0)
        pct = max(0.0, min(1.0, pct))
        fill_w = int(w * pct)
        if fill_w > 0:
            canvas.create_rectangle(0, 0, fill_w, h, fill=color, width=0)

    def setup_ui(self):
        # Outer Border
        self.border_frame = tk.Frame(self.root, bg="#2e2e36", bd=1)
        self.border_frame.pack(fill="both", expand=True, padx=1, pady=1)

        self.main_container = tk.Frame(self.border_frame, bg="#121214")
        self.main_container.pack(fill="both", expand=True, padx=1, pady=1)

        # ---------------- FULL DETAIL FRAME ----------------
        self.detail_frame = tk.Frame(self.main_container, bg="#121214", padx=15, pady=10)
        self.detail_frame.pack(fill="both", expand=True)

        # Header
        hdr = tk.Frame(self.detail_frame, bg="#121214")
        hdr.pack(fill="x", pady=(0, 4))

        lbl_title = tk.Label(hdr, text="✦ DSHA · 动态刷新额度雷达", font=(FONT_FAMILY, 10, "bold"), fg="#ffffff", bg="#121214")
        lbl_title.pack(side="left")

        btn_close = tk.Label(hdr, text="✕", font=(FONT_FAMILY, 9, "bold"), fg="#8e8e99", bg="#121214", cursor="hand2")
        btn_close.pack(side="right", padx=(8, 0))
        btn_close.bind("<Button-1>", lambda e: self.root.destroy())

        btn_min = tk.Label(hdr, text="—", font=(FONT_FAMILY, 9, "bold"), fg="#8e8e99", bg="#121214", cursor="hand2")
        btn_min.pack(side="right")
        btn_min.bind("<Button-1>", lambda e: self.toggle_mode())

        # Badges
        b_frame = tk.Frame(self.detail_frame, bg="#121214")
        b_frame.pack(fill="x", pady=(0, 8))
        self.lbl_badge = tk.Label(b_frame, text="Anty前台常驻 · 高清高刷", font=(FONT_FAMILY, 8), fg="#38bdf8", bg="#1e293b", padx=6, pady=2)
        self.lbl_badge.pack(side="left")

        self.lbl_countdown_chip = tk.Label(b_frame, text="⏱ 5H回血中", font=(FONT_FAMILY, 8, "bold"), fg="#34d399", bg="#064e3b", padx=6, pady=2)
        self.lbl_countdown_chip.pack(side="right")

        # 1. Context Window (已用 / 总额)
        c_hdr = tk.Frame(self.detail_frame, bg="#121214")
        c_hdr.pack(fill="x")
        tk.Label(c_hdr, text="当前上下文 (单轮)", font=(FONT_FAMILY, 9, "bold"), fg="#d4d4d8", bg="#121214").pack(side="left")
        self.lbl_ctx_main = tk.Label(c_hdr, text="已用 0 / 总额 1.0M (0%)", font=(FONT_FAMILY, 9, "bold"), fg="#38bdf8", bg="#121214")
        self.lbl_ctx_main.pack(side="right")

        self.canvas_ctx = tk.Canvas(self.detail_frame, height=5, bg="#242429", highlightthickness=0)
        self.canvas_ctx.pack(fill="x", pady=(3, 2))

        self.lbl_ctx_sub = tk.Label(self.detail_frame, text="剩余可用: 1.0M tok  |  末轮: 0  |  /compact 可重置", font=(FONT_FAMILY, 8), fg="#9ca3af", bg="#121214")
        self.lbl_ctx_sub.pack(anchor="w", pady=(0, 6))

        # 2. 5H Quota with Replenish Timer (已用 / 总额)
        f_hdr = tk.Frame(self.detail_frame, bg="#121214")
        f_hdr.pack(fill="x")
        tk.Label(f_hdr, text="5H 滚动配额 (动态回血)", font=(FONT_FAMILY, 9, "bold"), fg="#d4d4d8", bg="#121214").pack(side="left")
        self.lbl_5h_main = tk.Label(f_hdr, text="已用 0 / 总额 1.0M (0%)", font=(FONT_FAMILY, 9, "bold"), fg="#34d399", bg="#121214")
        self.lbl_5h_main.pack(side="right")

        self.canvas_5h = tk.Canvas(self.detail_frame, height=5, bg="#242429", highlightthickness=0)
        self.canvas_5h.pack(fill="x", pady=(3, 2))

        self.lbl_5h_recover = tk.Label(self.detail_frame, text="⏱ 下次回血: 00:00:00 (+0 tok)", font=(FONT_FAMILY, 8, "bold"), fg="#fbbf24", bg="#121214")
        self.lbl_5h_recover.pack(anchor="w")

        self.lbl_5h_full = tk.Label(self.detail_frame, text="⏳ 完全回满: 00:00:00  |  请求: 0/200 次", font=(FONT_FAMILY, 8), fg="#9ca3af", bg="#121214")
        self.lbl_5h_full.pack(anchor="w", pady=(0, 6))

        # 3. 7D Quota with Weekly Countdown (已用 / 总额)
        s_hdr = tk.Frame(self.detail_frame, bg="#121214")
        s_hdr.pack(fill="x")
        tk.Label(s_hdr, text="7D 周度总配额 (周倒计时)", font=(FONT_FAMILY, 9, "bold"), fg="#d4d4d8", bg="#121214").pack(side="left")
        self.lbl_7d_main = tk.Label(s_hdr, text="已用 0 / 总额 10.0M (0%)", font=(FONT_FAMILY, 9, "bold"), fg="#c084fc", bg="#121214")
        self.lbl_7d_main.pack(side="right")

        self.canvas_7d = tk.Canvas(self.detail_frame, height=5, bg="#242429", highlightthickness=0)
        self.canvas_7d.pack(fill="x", pady=(3, 2))

        self.lbl_7d_recover = tk.Label(self.detail_frame, text="🗓 周额度刷新倒计时: 00天 00h 00m", font=(FONT_FAMILY, 8, "bold"), fg="#c084fc", bg="#121214")
        self.lbl_7d_recover.pack(anchor="w")

        self.lbl_7d_sub = tk.Label(self.detail_frame, text="缓存复用: 0 tok  |  7天窗口动态推移", font=(FONT_FAMILY, 8), fg="#9ca3af", bg="#121214")
        self.lbl_7d_sub.pack(anchor="w", pady=(0, 2))

        # ---------------- CAPSULE MINI FRAME ----------------
        self.capsule_frame = tk.Frame(self.main_container, bg="#121214", padx=10, pady=6)
        cap_hdr = tk.Frame(self.capsule_frame, bg="#121214")
        cap_hdr.pack(fill="x")

        self.lbl_cap_text = tk.Label(cap_hdr, text="Ctx: 0/1M  |  5H: 0/1M  |  7D: 0/10M", font=(FONT_FAMILY, 8, "bold"), fg="#ffffff", bg="#121214")
        self.lbl_cap_text.pack(side="left")

        btn_expand = tk.Label(cap_hdr, text="▢", font=(FONT_FAMILY, 9), fg="#8e8e99", bg="#121214", cursor="hand2")
        btn_expand.pack(side="right")
        btn_expand.bind("<Button-1>", lambda e: self.toggle_mode())

        self.canvas_cap = tk.Canvas(self.capsule_frame, height=4, bg="#242429", highlightthickness=0)
        self.canvas_cap.pack(fill="x", pady=(3, 0))

        if self.mode == "capsule":
            self.detail_frame.pack_forget()
            self.capsule_frame.pack(fill="both", expand=True)

    def update_metrics(self):
        global GLOBAL_STATS
        st = get_telemetry()
        GLOBAL_STATS = st
        limits = self.config.get("limits", DEFAULT_CONFIG["limits"])

        # 1. Context Window (已用 / 总额)
        ctx_lim = limits.get("context_window_limit", 1000000)
        ctx_used = st["current_context_tokens"]
        ctx_pct = ctx_used / ctx_lim if ctx_lim else 0.0
        ctx_rem = max(0, ctx_lim - ctx_used)
        ctx_col = "#38bdf8"
        if ctx_pct > 0.85: ctx_col = "#f87171"
        elif ctx_pct > 0.70: ctx_col = "#fbbf24"

        self.lbl_ctx_main.config(text=f"已用 {fmt_tokens(ctx_used)} / 总额 {fmt_tokens(ctx_lim)} ({ctx_pct*100:.1f}%)", fg=ctx_col)
        self.lbl_ctx_sub.config(text=f"剩余可用: {fmt_tokens(ctx_rem)} tok  |  末轮: {st['last_step_output_tokens']} tok  |  /compact 可重置")
        self.draw_progress(self.canvas_ctx, ctx_pct, color=ctx_col)

        # 2. 5H Quota with Replenish Timers
        five_tok_lim = limits.get("5h_token_limit", 1000000)
        five_tok_used = st["5h_tokens"]
        five_tok_pct = five_tok_used / five_tok_lim if five_tok_lim else 0.0
        five_req_lim = limits.get("5h_request_limit", 200)
        five_req_used = st["5h_requests"]
        five_col = "#34d399"
        if five_tok_pct > 0.85:
            five_col = "#f87171"
        elif five_tok_pct > 0.70:
            five_col = "#fbbf24"

        self.lbl_5h_main.config(text=f"已用 {fmt_tokens(five_tok_used)} / 总额 {fmt_tokens(five_tok_lim)} ({five_tok_pct*100:.1f}%)", fg=five_col)

        next_sec = st.get("5h_next_recover_seconds", 0)
        next_tok = st.get("5h_next_recover_tokens", 0)
        full_sec = st.get("5h_full_recover_seconds", 0)

        next_str = fmt_countdown(next_sec)
        full_str = fmt_countdown(full_sec)

        self.lbl_5h_recover.config(text=f"⏱ 下次回血: {next_str} (释放 +{fmt_tokens(next_tok)} tok)")
        self.lbl_5h_full.config(text=f"⏳ 完全回满: {full_str}  |  请求: {five_req_used}/{five_req_lim}次")
        self.lbl_countdown_chip.config(text=f"5H回血: {next_str}")
        self.draw_progress(self.canvas_5h, five_tok_pct, color=five_col)

        # 3. 7D Quota with Weekly Countdown
        sev_tok_lim = limits.get("7d_token_limit", 10000000)
        sev_tok_used = st["7d_tokens"]
        sev_tok_pct = sev_tok_used / sev_tok_lim if sev_tok_lim else 0.0
        sev_req_lim = limits.get("7d_request_limit", 1500)
        sev_req_used = st["7d_requests"]
        sev_col = "#c084fc"

        sev_next_sec = st.get("7d_next_recover_seconds", 0)
        sev_next_str = fmt_countdown(sev_next_sec)

        self.lbl_7d_main.config(text=f"已用 {fmt_tokens(sev_tok_used)} / 总额 {fmt_tokens(sev_tok_lim)} ({sev_tok_pct*100:.1f}%)", fg=sev_col)
        self.lbl_7d_recover.config(text=f"🗓 周额度刷新倒计时: {sev_next_str} (释放首笔)")
        self.lbl_7d_sub.config(text=f"缓存复用: {fmt_tokens(st['7d_cached_tokens'])} tok  |  总请求: {sev_req_used}/{fmt_tokens(sev_req_lim)}次")
        self.draw_progress(self.canvas_7d, sev_tok_pct, color=sev_col)

        # Capsule format
        self.lbl_cap_text.config(text=f"Ctx: {fmt_tokens(ctx_used)}/{fmt_tokens(ctx_lim)} | 5H: {fmt_tokens(five_tok_used)}/{fmt_tokens(five_tok_lim)} ({next_str}) | 7D: {sev_next_str}")
        self.draw_progress(self.canvas_cap, max(ctx_pct, five_tok_pct), color=ctx_col)

    def poll_loop(self):
        try:
            self.update_metrics()
        except Exception:
            pass
        if self.running:
            self.root.after(1000, self.poll_loop)

if __name__ == "__main__":
    t = threading.Thread(target=start_http_server, daemon=True)
    t.start()

    root = tk.Tk()
    app = DshaMeterApp(root)
    root.mainloop()
