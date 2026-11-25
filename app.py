from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
import numpy as np
from paddleocr import PaddleOCR
from PIL import Image, ImageOps, UnidentifiedImageError
import os
import re
import unicodedata

BASE_DIR = Path(__file__).resolve().parent
APP_VERSION = '2026.11.26-r1' 
app = Flask(__name__, static_folder=None)
app.config['MAX_CONTENT_LENGTH'] = 12 * 1024 * 1024  # 12 MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
FIELD_LABELS = re.compile(
    r'(?<![A-Z0-9_./-])(?:'
    r'(?P<model_name>MODEL(?:\s*(?:NO\b\.?|NUMBER\b|NAME\b))?(?![A-Z0-9_./-])|製品型式|製品型番|型式|型番|形式|機種名)'
    r'|(?P<serial_no>SERIAL(?:\s*(?:NO\b\.?|NUMBER\b))?(?![A-Z0-9_./-])|S\s*/\s*N\.?(?![A-Z0-9_./-])|S\s*\.\s*N\b\.?(?![A-Z0-9_./-])|シリアル(?:\s*NO\b\.?|番号)?|製造番号)'
    r'|(?P<version>VERSION(?![A-Z0-9_./-])|VER(?![A-Z0-9_/-])\.?|バージョン)'
    r')',
    re.IGNORECASE | re.ASCII,
)
FIELD_VALUE = re.compile(r'[A-Za-z0-9](?:[A-Za-z0-9._/+\-]*[A-Za-z0-9+])?')
FIELD_NAMES = ('model_name', 'serial_no', 'version')

# OCRモデルは起動時に1回だけロードする。CPU環境で動作。
ocr = PaddleOCR(
    lang='japan',
    device='cpu',
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=True,
)


def extract_fields(lines):
    """明示的なラベルと値を対応付け、候補が競合する項目は自動入力しない。"""
    texts = [unicodedata.normalize('NFKC', line['text']).strip() for line in lines]
    candidates = {field: {} for field in FIELD_NAMES}

    for index, text in enumerate(texts):
        labels = list(FIELD_LABELS.finditer(text))
        # ラベルから始まる行だけを対象にして、注意書きなどの誤入力を抑える。
        if not labels or text[:labels[0].start()].strip(' ・【['):
            continue
        for offset, label in enumerate(labels):
            end = labels[offset + 1].start() if offset + 1 < len(labels) else len(text)
            value = text[label.end():end].strip(' \t:=#;,.|・【】[]')
            from_next_line = not value and len(labels) == 1 and index + 1 < len(texts)
            if from_next_line:
                value = texts[index + 1].strip(' \t:=#;,.|・【】[]')
            if not FIELD_VALUE.fullmatch(value) or FIELD_LABELS.fullmatch(value):
                continue
            if value.upper() in {'NO', 'NUMBER', 'NAME', 'NONE', 'N/A', 'NA'}:
                continue
            if (from_next_line or label.lastgroup == 'version') and not any(c.isdigit() for c in value):
                continue
            candidates[label.lastgroup].setdefault(value.upper(), value)

    return {
        field: next(iter(values.values())) if len(values) == 1 else ''
        for field, values in candidates.items()
    }

@app.get('/')
@app.get('/index.html')
def home():
    # PCとスマートフォンで同じHTMLを返す。
    return send_from_directory(BASE_DIR, 'index.html')

@app.get('/styles.css')
def styles():
    return send_from_directory(BASE_DIR, 'styles.css')

@app.get('/manifest.json')
def manifest():
    return send_from_directory(BASE_DIR, 'manifest.json')

@app.after_request
def disable_stale_screen_cache(response):
    # 旧版HTML/CSSがスマートフォンに残らないようにする。
    if request.path in ('/', '/index.html', '/styles.css', '/manifest.json', '/api/health'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response

@app.get('/api/health')
def health():
    return jsonify({'ok': True, 'version': APP_VERSION, 'engine': 'PaddleOCR', 'language': 'japan'})

@app.post('/api/ocr')
def run_ocr():
    uploaded = request.files.get('image')
    if not uploaded or not uploaded.filename:
        return jsonify({'error': '画像ファイルが送信されていません。'}), 400
    ext = Path(uploaded.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': '対応画像形式は JPG / PNG / WEBP / BMP です。'}), 400

    # EXIFの向き補正と色変換だけを行い、PaddleOCRへ連続したBGR配列を渡す。
    try:
        with Image.open(uploaded.stream) as source:
            rgb = np.asarray(ImageOps.exif_transpose(source).convert('RGB'))
        bgr = np.ascontiguousarray(rgb[:, :, ::-1])
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError):
        return jsonify({'error': '画像を読み込めませんでした。対応形式で撮影し直してください。'}), 400

    try:
        results = ocr.predict(bgr)
        lines = []
        for result in results:
            texts = result.get('rec_texts', [])
            scores = result.get('rec_scores', [])
            for i, text in enumerate(texts):
                text = str(text).strip()
                if not text:
                    continue
                score = float(scores[i]) if i < len(scores) else None
                lines.append({'text': text, 'confidence': round(score, 4) if score is not None else None})
        return jsonify({
            **extract_fields(lines),
            'lines': lines,
            'text': '\n'.join(row['text'] for row in lines),
        })
    except Exception as exc:
        app.logger.exception('PaddleOCR failed')
        return jsonify({'error': f'画像解析中にエラーが発生しました: {type(exc).__name__}: {exc}'}), 500

if __name__ == '__main__':
    # LAN内のスマートフォンからアクセスできるよう全インターフェースで待ち受ける
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '5000')), debug=False)
