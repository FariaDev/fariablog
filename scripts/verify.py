import html.parser
import json
import re
import sys
import tomllib
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

repo = Path(sys.argv[1])
production = Path(sys.argv[2])
development = Path(sys.argv[3])
config = tomllib.loads((repo / "config.toml").read_text(encoding="utf-8"))
base_url = config["baseURL"]
site_host = urlparse(base_url).hostname
language_descriptions = {
    code: language["params"]["description"]
    for code, language in config["languages"].items()
}


def fail(message):
    raise SystemExit(f"verify: {message}")


class DocumentParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.start_tags = []
        self.metas = []
        self.links = []
        self.images = []
        self.references = []
        self.jsonld = []
        self._jsonld_buffer = None

    def _record_start(self, tag, attrs):
        raw = self.get_starttag_text() or ""
        self.start_tags.append(raw)
        attrs_dict = {key.lower(): value for key, value in attrs if key}
        if tag.lower() == "meta":
            self.metas.append(attrs_dict)
        if tag.lower() == "link":
            self.links.append(attrs_dict)
        if tag.lower() == "img":
            self.images.append(attrs_dict)
        if "href" in attrs_dict:
            self.references.append(attrs_dict["href"])
        if "src" in attrs_dict:
            self.references.append(attrs_dict["src"])
        if tag.lower() in {"script"}:
            script_type = (attrs_dict.get("type") or "").lower()
            if script_type == "application/ld+json":
                self._jsonld_buffer = []

    def handle_starttag(self, tag, attrs):
        self._record_start(tag, attrs)

    def handle_startendtag(self, tag, attrs):
        self._record_start(tag, attrs)
        if tag.lower() == "script" and self._jsonld_buffer is not None:
            self.jsonld.append("".join(self._jsonld_buffer))
            self._jsonld_buffer = None

    def handle_data(self, data):
        if self._jsonld_buffer is not None:
            self._jsonld_buffer.append(data)

    def handle_entityref(self, name):
        if self._jsonld_buffer is not None:
            self._jsonld_buffer.append(f"&{name};")

    def handle_charref(self, name):
        if self._jsonld_buffer is not None:
            self._jsonld_buffer.append(f"&#{name};")

    def handle_endtag(self, tag):
        if tag.lower() == "script" and self._jsonld_buffer is not None:
            self.jsonld.append("".join(self._jsonld_buffer))
            self._jsonld_buffer = None


def validate_attribute_syntax(raw, path):
    """Reject the common malformed-attribute cases without third-party parsers."""
    if not raw.startswith("<") or raw.startswith(("<!--", "<!", "<?", "</")):
        return
    index = 1
    while index < len(raw) and raw[index].isspace():
        index += 1
    tag_start = index
    while index < len(raw) and not raw[index].isspace() and raw[index] not in "/>":
        index += 1
    if index == tag_start:
        fail(f"malformed start tag in {path}: {raw[:120]!r}")

    while index < len(raw):
        while index < len(raw) and raw[index].isspace():
            index += 1
        if index >= len(raw):
            fail(f"unterminated start tag in {path}: {raw[:120]!r}")
        if raw[index] == ">":
            return
        if raw[index] == "/":
            index += 1
            while index < len(raw) and raw[index].isspace():
                index += 1
            if index < len(raw) and raw[index] == ">":
                return
            fail(f"malformed self-closing tag in {path}: {raw[:120]!r}")

        name_start = index
        while index < len(raw) and not raw[index].isspace() and raw[index] not in "=/>\"'":
            if raw[index] == "<":
                fail(f"malformed attribute name in {path}: {raw[:120]!r}")
            index += 1
        name = raw[name_start:index]
        if not name or any(char in name for char in "<>"):
            fail(f"malformed attribute in {path}: {raw[:120]!r}")
        while index < len(raw) and raw[index].isspace():
            index += 1
        if index >= len(raw):
            fail(f"unterminated attribute in {path}: {raw[:120]!r}")
        if raw[index] != "=":
            continue
        index += 1
        while index < len(raw) and raw[index].isspace():
            index += 1
        if index >= len(raw):
            fail(f"missing attribute value in {path}: {raw[:120]!r}")

        if raw[index] in "\"'":
            quote = raw[index]
            index += 1
            value_start = index
            while index < len(raw) and raw[index] != quote:
                if raw[index] == "<":
                    fail(f"markup inside quoted attribute in {path}: {raw[:160]!r}")
                index += 1
            if index >= len(raw):
                fail(f"unterminated quoted attribute in {path}: {raw[:160]!r}")
            index += 1
        else:
            value_start = index
            while index < len(raw) and not raw[index].isspace() and raw[index] != ">":
                if raw[index] in "<'\"=":
                    fail(f"malformed unquoted attribute in {path}: {raw[:160]!r}")
                index += 1
            if index == value_start:
                fail(f"missing unquoted attribute value in {path}: {raw[:160]!r}")


def parse_document(path):
    parser = DocumentParser()
    try:
        parser.feed(path.read_text(encoding="utf-8"))
        parser.close()
    except Exception as error:
        fail(f"could not parse HTML {path}: {error}")
    for raw in parser.start_tags:
        validate_attribute_syntax(raw, path)
    parsed_jsonld = []
    for block in parser.jsonld:
        try:
            parsed_jsonld.append(json.loads(block))
        except json.JSONDecodeError as error:
            fail(f"invalid JSON-LD in {path}: {error}")
    return parser, parsed_jsonld


def all_html(root):
    return sorted(root.rglob("*.html"))


def page_url(path, root):
    relative = path.relative_to(root).as_posix()
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[: -len("index.html")]
    return "/" + relative


def local_target(root, current_page, raw_url):
    raw_url = (raw_url or "").strip()
    if not raw_url or raw_url.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return None
    absolute = urljoin(base_url + page_url(current_page, root).lstrip("/"), raw_url)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"}:
        return None
    if parsed.netloc and parsed.hostname != site_host:
        return None
    request_path = unquote(parsed.path or "/")
    if not request_path.startswith("/"):
        return None
    relative = request_path.lstrip("/")
    candidates = []
    if request_path.endswith("/"):
        candidates.append(root / relative / "index.html")
    else:
        candidates.extend(
            [
                root / relative,
                root / relative / "index.html",
                root / (relative + ".html"),
            ]
        )
    return next((candidate for candidate in candidates if candidate.is_file()), None)


def meta_value(parser, key, value):
    for meta in parser.metas:
        if (meta.get("name") == key or meta.get("property") == key) and meta.get("content") == value:
            return True
    return False


def refresh_target(meta):
    if meta.get("http-equiv", "").lower() != "refresh":
        return None
    _, separator, directive = meta.get("content", "").partition(";")
    if not separator:
        return None
    key, separator, value = directive.partition("=")
    if not separator or key.strip().lower() != "url":
        return None
    return value.strip().strip("\"'")


def require(condition, message):
    if not condition:
        fail(message)


prod_files = all_html(production)
dev_files = all_html(development)
require(prod_files, "production build emitted no HTML")
require(dev_files, "development build emitted no HTML")

prod_docs = {path: parse_document(path) for path in prod_files}
dev_docs = {path: parse_document(path) for path in dev_files}

# Every JSON-LD block is parsed above; both modes keep structured data, while robots and analytics remain environment-specific.
prod_jsonld_count = sum(len(jsonld) for _, jsonld in prod_docs.values())
require(prod_jsonld_count > 0, "production build emitted no JSON-LD blocks")

production_home_en = production / "en" / "index.html"
production_home_pt = production / "pt-br" / "index.html"
development_home_en = development / "en" / "index.html"
development_home_pt = development / "pt-br" / "index.html"
for path in (production_home_en, production_home_pt, development_home_en, development_home_pt):
    require(path.is_file(), f"expected language home is missing: {path}")

for path, language in ((production_home_en, "en"), (production_home_pt, "pt-br")):
    parser, jsonld = prod_docs[path]
    expected = language_descriptions[language]
    for key in ("description", "og:description", "twitter:description"):
        require(meta_value(parser, key, expected), f"{key} is not language-specific in {path}")
    require(any(isinstance(item, dict) and item.get("description") == expected for item in jsonld), f"JSON-LD description is not language-specific in {path}")
    require(meta_value(parser, "robots", "index, follow"), f"production robots metadata is wrong in {path}")

for path in (development_home_en, development_home_pt):
    parser, jsonld = dev_docs[path]
    require(meta_value(parser, "robots", "noindex, nofollow"), f"development robots metadata is wrong in {path}")

production_text = "\n".join(path.read_text(encoding="utf-8") for path in prod_files)
development_text = "\n".join(path.read_text(encoding="utf-8") for path in dev_files)
require("https://cloud.umami.is/script.js" in production_text, "production output is missing analytics")
require("https://cloud.umami.is/script.js" not in development_text, "development output contains analytics")

english_home_text = production_home_en.read_text(encoding="utf-8")
portuguese_home_text = production_home_pt.read_text(encoding="utf-8")
english_search_text = (production / "en" / "search" / "index.html").read_text(encoding="utf-8")
require("Philosophy · Literature · Neuroscience · Education" in english_home_text, "English home contains the wrong subject labels")
default_home = urljoin(base_url, f'{config["defaultContentLanguage"]}/')
require(
    any(link.get("hreflang") == "x-default" and link.get("href") == default_home for link in prod_docs[production_home_en][0].links),
    "English home has the wrong x-default URL",
)
require("fuse.basic" not in english_home_text, "Fuse is loaded outside the search page")
require("fuse.basic" in english_search_text, "search page is missing Fuse")

for language in ("en", "pt-br"):
    records = json.loads((production / language / "index.json").read_text(encoding="utf-8"))
    require(records and all(record["section"] == "posts" for record in records), f"{language} search index contains non-post pages")

    feed_path = production / language / "index.xml"
    try:
        feed = ET.parse(feed_path).getroot()
    except (ET.ParseError, OSError) as error:
        fail(f"invalid RSS feed {feed_path}: {error}")
    channel = feed.find("channel")
    require(channel is not None, f"RSS feed has no channel: {feed_path}")
    atom_link = channel.find("{http://www.w3.org/2005/Atom}link")
    require(atom_link is not None and atom_link.get("href") == urljoin(base_url, f"{language}/index.xml"), f"RSS self URL is wrong in {feed_path}")
    expected_feed_items = min(len(records), config["params"]["rssLimit"])
    require(len(channel.findall("item")) == expected_feed_items, f"RSS item limit is wrong in {language}")

root_404 = production / "404.html"
require(root_404.is_file(), "root production 404 is missing")
root_404_parser = prod_docs[root_404][0]
expected_404_target = f'/{config["defaultContentLanguage"]}/404.html'
require(
    any(refresh_target(meta) == expected_404_target for meta in root_404_parser.metas),
    "root 404 does not redirect to the localized fallback",
)
require(not list(production.glob("*/tags/**/*.xml")), "contextual taxonomy feeds should be disabled")

# Every generated local reference must resolve to a file in the same build.
for root, docs in ((production, prod_docs), (development, dev_docs)):
    for path, (parser, _) in docs.items():
        for raw_url in parser.references:
            raw_url = (raw_url or "").strip()
            if not raw_url or raw_url.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
                continue
            resolved = urlparse(urljoin(base_url + page_url(path, root).lstrip("/"), raw_url))
            if resolved.hostname not in {site_host, None}:
                continue
            require(local_target(root, path, raw_url) is not None, f"broken local reference {raw_url!r} in {path}")

# Processable editorial images must have plain-text alternatives, dimensions, lazy loading, and responsive WebP sources.
for path, (parser, _) in prod_docs.items():
    if "/posts/" not in path.relative_to(production).as_posix():
        continue
    editorial_images = [image for image in parser.images if "/images/" in urlparse(image.get("src", "")).path]
    if not editorial_images:
        continue
    if "article-sheet" in path.read_text(encoding="utf-8"):
        require(editorial_images[0].get("loading") == "eager", f"first editorial image is lazy-loaded in {path}")
    for image in editorial_images:
        require(image.get("alt") is not None and "<" not in image["alt"] and ">" not in image["alt"], f"editorial image has malformed alt text in {path}")
        require(image.get("loading") in {"lazy", "eager"}, f"editorial image has no loading policy in {path}")
        require(image.get("width", "").isdigit() and int(image["width"]) > 0, f"editorial image has no intrinsic width in {path}")
        require(image.get("height", "").isdigit() and int(image["height"]) > 0, f"editorial image has no intrinsic height in {path}")
        require(image.get("srcset") and ".webp" in image["srcset"], f"editorial image has no responsive WebP source in {path}")
        for candidate in image["srcset"].split(","):
            candidate_url = candidate.strip().split()[0]
            require(local_target(production, path, candidate_url) is not None, f"broken responsive image source {candidate_url!r} in {path}")

# Cache policy: immutable is reserved for fingerprinted Hugo resource namespaces.
headers = (repo / "static" / "_headers").read_text(encoding="utf-8")
immutable_routes = {"/assets/*", "/css/*", "/js/*"}
current_route = None
for line in headers.splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        continue
    if line[0].isspace():
        if "immutable" in stripped:
            require(current_route in immutable_routes, f"immutable cache policy is attached to {current_route}")
    else:
        current_route = stripped
require("must-revalidate" in headers, "stable asset cache policy does not require revalidation")

print(
    f"Verified {len(prod_files)} production and {len(dev_files)} development HTML files; "
    f"parsed {prod_jsonld_count} production JSON-LD blocks."
)
