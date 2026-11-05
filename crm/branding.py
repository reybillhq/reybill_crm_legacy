"""Customer-facing defaults. Internal app and integration identifiers stay unchanged."""
import json
from pathlib import Path

BRANDING = json.loads(Path(__file__).with_name("branding.json").read_text())
PRODUCT_NAME = BRANDING["productName"]
