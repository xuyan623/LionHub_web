#!/usr/bin/env python3
r"""Lion Hub 局域网带宽测试脚本

测试内容：
- 上传速度：生成临时文件上传到 /api/uploads
- 下载速度：从 /uploads/ 下载已上传的测试文件

用法：
    .venv\Scripts\python.exe scripts/test_bandwidth.py
    .venv\Scripts\python.exe scripts/test_bandwidth.py --size 50
    .venv\Scripts\python.exe scripts/test_bandwidth.py --host 192.168.1.100:4173
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
import time
import urllib.request
from io import BytesIO

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent


def read_api_key() -> str:
    creds_path = PROJECT_ROOT / "data" / "secret_admin_credentials.json"
    if not creds_path.is_file():
        print("[✗] 未找到管理员凭据文件，无法获取 API Key")
        sys.exit(1)
    try:
        creds = json.loads(creds_path.read_text(encoding="utf-8"))
        return creds.get("apiKey", "")
    except (OSError, json.JSONDecodeError) as exc:
        print(f"[✗] 读取凭据失败: {exc}")
        sys.exit(1)


def check_server(base_url: str) -> bool:
    try:
        req = urllib.request.Request(f"{base_url}/api/health", method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False


def test_upload(base_url: str, api_key: str, size_mb: int) -> tuple[float, float]:
    """返回 (耗时秒, 速度 MB/s)"""
    size_bytes = size_mb * 1024 * 1024
    data = BytesIO(b"0" * size_bytes)

    boundary = "----WebKitFormBoundaryBandwidthTest"
    body_prefix = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="taskId"\r\n\r\n'
        f"bandwidth_test_task\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="source"\r\n\r\n'
        f"submission\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="files"; filename="test_{size_mb}mb.bin"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode("utf-8")
    body_suffix = f"\r\n--{boundary}--\r\n".encode("utf-8")

    body = body_prefix + data.getvalue() + body_suffix

    req = urllib.request.Request(
        f"{base_url}/api/uploads",
        data=body,
        method="POST",
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "X-API-Key": api_key,
        },
    )

    print(f"[*] 正在上传 {size_mb} MB 测试文件...")
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        print(f"[✗] 上传失败: {exc}")
        return 0.0, 0.0
    elapsed = time.perf_counter() - start

    speed_mbps = (size_bytes * 8) / (elapsed * 1_000_000)  # Mbps
    speed_mbs = size_mb / elapsed  # MB/s

    # 清理测试文件
    try:
        attachments = result.get("attachments", [])
        for att in attachments:
            storage_path = att.get("storagePath", "")
            if storage_path:
                del_req = urllib.request.Request(
                    f"{base_url}/api/uploads/delete",
                    data=json.dumps({"paths": [storage_path]}).encode("utf-8"),
                    method="POST",
                    headers={
                        "Content-Type": "application/json",
                        "X-API-Key": api_key,
                    },
                )
                with urllib.request.urlopen(del_req, timeout=10):
                    pass
    except Exception:
        pass

    return elapsed, speed_mbps


def test_download(base_url: str, api_key: str, size_mb: int) -> tuple[float, float]:
    """先上传文件再下载，返回 (耗时秒, 速度 Mbps)"""
    size_bytes = size_mb * 1024 * 1024
    boundary = "----WebKitFormBoundaryBandwidthTest"
    body_prefix = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="taskId"\r\n\r\n'
        f"bandwidth_test_task\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="source"\r\n\r\n'
        f"submission\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="files"; filename="download_test_{size_mb}mb.bin"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode("utf-8")
    body_suffix = f"\r\n--{boundary}--\r\n".encode("utf-8")
    body = body_prefix + (b"1" * size_bytes) + body_suffix

    # 上传
    req = urllib.request.Request(
        f"{base_url}/api/uploads",
        data=body,
        method="POST",
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "X-API-Key": api_key,
        },
    )

    print(f"[*] 正在准备 {size_mb} MB 下载测试文件...")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        print(f"[✗] 准备下载文件失败: {exc}")
        return 0.0, 0.0

    attachments = result.get("attachments", [])
    if not attachments:
        print("[✗] 上传后未返回文件路径")
        return 0.0, 0.0

    download_url = attachments[0].get("url", "")
    storage_path = attachments[0].get("storagePath", "")

    # 下载
    print(f"[*] 正在下载 {size_mb} MB 测试文件...")
    start = time.perf_counter()
    downloaded = 0
    try:
        with urllib.request.urlopen(f"{base_url}{download_url}", timeout=120) as resp:
            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                downloaded += len(chunk)
    except Exception as exc:
        print(f"[✗] 下载失败: {exc}")
        return 0.0, 0.0
    elapsed = time.perf_counter() - start

    speed_mbps = (downloaded * 8) / (elapsed * 1_000_000)

    # 清理
    try:
        if storage_path:
            del_req = urllib.request.Request(
                f"{base_url}/api/uploads/delete",
                data=json.dumps({"paths": [storage_path]}).encode("utf-8"),
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": api_key,
                },
            )
            with urllib.request.urlopen(del_req, timeout=10):
                pass
    except Exception:
        pass

    return elapsed, speed_mbps


def main() -> None:
    parser = argparse.ArgumentParser(description="Lion Hub 带宽测试")
    parser.add_argument("--host", default="http://127.0.0.1:4173", help="服务地址 (默认: http://127.0.0.1:4173)")
    parser.add_argument("--size", type=int, default=10, help="测试文件大小，单位 MB (默认: 10)")
    args = parser.parse_args()

    base_url = args.host.rstrip("/")
    size_mb = args.size

    print("=" * 50)
    print("  Lion Hub 带宽测试")
    print(f"  目标: {base_url}")
    print("=" * 50)

    if not check_server(base_url):
        print("[✗] 无法连接到服务，请先启动服务器:")
        print(f"    .\\start_server.ps1 start")
        sys.exit(1)

    api_key = read_api_key()
    print("[✓] 服务在线，API Key 已读取")
    print()

    # 上传测试
    upload_time, upload_speed = test_upload(base_url, api_key, size_mb)
    if upload_time > 0:
        print(f"[✓] 上传完成")
        print(f"    耗时: {upload_time:.2f} 秒")
        print(f"    速度: {upload_speed:.2f} Mbps ({size_mb/upload_time:.2f} MB/s)")
        print()

    # 下载测试
    download_time, download_speed = test_download(base_url, api_key, size_mb)
    if download_time > 0:
        print(f"[✓] 下载完成")
        print(f"    耗时: {download_time:.2f} 秒")
        print(f"    速度: {download_speed:.2f} Mbps ({size_mb/download_time:.2f} MB/s)")
        print()

    print("=" * 50)
    print("  测试结束")
    print("=" * 50)


if __name__ == "__main__":
    main()
