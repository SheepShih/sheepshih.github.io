#!/usr/bin/env python3
"""Works の中身を暗号化して assets/works.enc.json に書き出す。

  WORKS_PASS=番号 python3 tools/encrypt-works.py

中身の原稿は private/works-content.html(gitの対象外)。
番号はこのファイルにもリポジトリにも書かないこと。
必要なライブラリ: cryptography
"""
import base64, json, os, sys
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ITER = 600000

password = os.environ.get("WORKS_PASS", "")
if not password.isdigit():
    sys.exit("WORKS_PASS に数字の番号を指定してください")
plain = open(os.path.join(ROOT, "private/works-content.html"), "rb").read()
salt, iv = os.urandom(16), os.urandom(12)
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(password.encode())
ct = AESGCM(key).encrypt(iv, plain, None)
b64 = lambda b: base64.b64encode(b).decode()
data = {"iter": ITER, "digits": len(password), "salt": b64(salt), "iv": b64(iv), "ct": b64(ct)}
with open(os.path.join(ROOT, "assets/works.enc.json"), "w") as f:
    json.dump(data, f)
print("wrote assets/works.enc.json")
