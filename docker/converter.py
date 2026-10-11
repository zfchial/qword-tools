import os
import subprocess
import sys
from pathlib import Path

work = Path("/work").resolve()
source = (work / Path(sys.argv[1]).name).resolve()
target = (work / Path(sys.argv[2]).name).resolve()
if source.parent != work or target.parent != work or not source.is_file() or target.exists():
    raise SystemExit(2)
if source.suffix.lower() == ".docx" and target.suffix.lower() == ".pdf":
    profile = "file:///tmp/lo-" + os.urandom(12).hex()
    result = subprocess.run(["soffice", "-env:UserInstallation=" + profile, "--headless", "--convert-to", "pdf:writer_pdf_Export", "--outdir", str(work), str(source)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=90, check=False)
    produced = work / (source.stem + ".pdf")
    if result.returncode != 0 or not produced.is_file():
        raise SystemExit(3)
    produced.replace(target)
elif source.suffix.lower() == ".pdf" and target.suffix.lower() == ".docx":
    from pdf2docx import Converter
    converter = Converter(str(source))
    try:
        converter.convert(str(target), start=0, end=None)
    finally:
        converter.close()
else:
    raise SystemExit(2)
if not target.is_file() or not target.stat().st_size or target.stat().st_size > 100 * 1024 * 1024:
    raise SystemExit(4)
print(target.name)
