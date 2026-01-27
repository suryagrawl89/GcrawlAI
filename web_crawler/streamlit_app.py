import streamlit as st
import requests
import threading
import queue
import json
import time
from websocket import WebSocketApp
from pathlib import Path

# ================= CONFIG =================

API_BASE = "http://127.0.0.1:8000"
WS_BASE = "ws://127.0.0.1:8000"

# ================= SESSION STATE =================

if "crawl_id" not in st.session_state:
    st.session_state.crawl_id = None

if "messages" not in st.session_state:
    st.session_state.messages = queue.Queue()

if "rendered_files" not in st.session_state:
    st.session_state.rendered_files = set()

# ================= WEBSOCKET THREAD =================


def load_existing_markdown(crawl_id: str):
    base_dir = Path("web_crawler/crawl_output-api")
    crawl_dir = next(base_dir.glob(f"*{crawl_id}"), None)

    if not crawl_dir or not crawl_dir.exists():
        return []

    return sorted(crawl_dir.glob("*.md"))


def websocket_listener(crawl_id: str, message_queue: queue.Queue):
    def on_message(ws, message):
        try:
            data = json.loads(message)
            message_queue.put(data)
        except Exception as e:
            print("WS parse error:", e)

    def on_error(ws, error):
        print("WebSocket error:", error)

    def on_close(ws, *args):
        print("WebSocket closed")

    ws = WebSocketApp(
        f"{WS_BASE}/ws/crawl/{crawl_id}",
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
    )

    ws.run_forever()

# ================= UI =================

st.title("🕷️ Live Web Crawler")

with st.form("crawl_form"):
    url = st.text_input("Website URL", placeholder="https://example.com")
    crawl_mode = st.selectbox("Crawl Mode", ["single", "all"])
    submitted = st.form_submit_button("Start Crawl")

if submitted:
    if not url:
        st.error("URL is required")
    else:
        resp = requests.post(
            f"{API_BASE}/crawler",
            json={"url": url, "crawl_mode": crawl_mode},
            timeout=300,
        )

        if resp.status_code != 200:
            st.error(resp.text)
        else:
            data = resp.json()
            st.session_state.crawl_id = data["crawl_id"]

            st.success(f"Crawl started (ID: {st.session_state.crawl_id})")

            # 🔥 NOW crawl_id exists
            st.info("Loading already generated pages...")

            for md_file in load_existing_markdown(st.session_state.crawl_id):
                render_resp = requests.get(
                    f"{API_BASE}/crawl/render",
                    params={"file_path": str(md_file)},
                    timeout=30,
                )
                if render_resp.status_code == 200:
                    st.components.v1.html(
                        render_resp.text,
                        height=600,
                        scrolling=True,
                    )

            # Start WebSocket listener
            ws_thread = threading.Thread(
                target=websocket_listener,
                args=(st.session_state.crawl_id, st.session_state.messages),
                daemon=True,
            )
            ws_thread.start()


# ================= LIVE RENDER =================

st.markdown("---")
st.subheader("📄 Generated Pages")

placeholder = st.empty()

# Pull messages from WS queue
while not st.session_state.messages.empty():
    msg = st.session_state.messages.get()

    if msg.get("type") == "markdown_ready":
        file_path = msg.get("file_path")

        # Avoid duplicate renders
        if file_path in st.session_state.rendered_files:
            continue

        st.session_state.rendered_files.add(file_path)

        # Fetch rendered HTML
        render_resp = requests.get(
            f"{API_BASE}/crawl/render",
            params={"file_path": file_path},
            timeout=300,
        )

        if render_resp.status_code == 200:
            with st.container():
                st.markdown(
                    f"### Page {msg.get('page')} – {msg.get('url')}"
                )
                st.components.v1.html(
                    render_resp.text,
                    height=600,
                    scrolling=True,
                )

    elif msg.get("type") == "crawl_completed":
        st.success("✅ Crawl completed")

# Small sleep to allow Streamlit refresh loop
time.sleep(0.3)
st.rerun()