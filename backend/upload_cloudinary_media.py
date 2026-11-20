import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from pathlib import Path
import cloudinary.uploader
import cloudinary.api
from django.conf import settings

MEDIA_DIR = Path(settings.MEDIA_ROOT) / "products"
DRY_RUN = False  # First run only lists files; change to False to upload.

if not MEDIA_DIR.is_dir():
    raise SystemExit(f"Media directory not found: {MEDIA_DIR}")

cloudinary.api.ping()

extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
files = sorted(
    p for p in MEDIA_DIR.rglob("*")
    if p.is_file() and p.suffix.lower() in extensions
)

print(f"Found {len(files)} image files under {MEDIA_DIR}")

if DRY_RUN:
    for path in files:
        public_id = path.relative_to(settings.MEDIA_ROOT).with_suffix("").as_posix()
        print(f"Would upload: {path} -> {public_id}")
    print("\nDry run only. No images uploaded.")
    print("If the list looks right, set DRY_RUN = False and run again.")
else:
    succeeded = 0
    failed = []

    for index, path in enumerate(files, 1):
        public_id = path.relative_to(settings.MEDIA_ROOT).with_suffix("").as_posix()
        try:
            result = cloudinary.uploader.upload(
                str(path),
                public_id=public_id,
                overwrite=True,
                resource_type="image",
            )
            succeeded += 1
            print(f"[{index}/{len(files)}] OK: {public_id}.{result['format']}")
        except Exception as exc:
            failed.append((str(path), str(exc)))
            print(f"[{index}/{len(files)}] FAILED: {path}: {exc}")

    print(f"\nUploaded successfully: {succeeded}/{len(files)}")
    print(f"Failed: {len(failed)}")
    if failed:
        Path("cloudinary_upload_failures.txt").write_text(
            "\n".join(f"{p}\t{e}" for p, e in failed),
            encoding="utf-8",
        )
        print("Failure details saved to cloudinary_upload_failures.txt")
