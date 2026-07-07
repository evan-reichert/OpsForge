"""
model.py — All AI and heuristic analysis logic for OpsForge.

Responsibilities:
  - Keyword-based issue categorisation (_heuristic_issue_counts)
  - Heuristic health scoring (_heuristic_health)
  - Report text generation (_build_report_text, _build_fallback_advice)
  - Structured data summary construction (_build_data_summary)
  - GPT-4o-mini interpretation (_ai_interpretation)

main.py imports and calls interpret_csv(), the single public entry point.
"""

# Import dependencies
import json
import os
import sys
from collections import Counter

from dotenv import load_dotenv
load_dotenv()

import pandas as pd
from openai import OpenAI


def _find_text_column(df: pd.DataFrame) -> str | None:
    """Return the best candidate text column for ticket-level severity inference."""
    for candidate in ["description", "summary", "issue", "subject", "ticket", "notes", "comment", "details", "problem"]:
        matched = next((c for c in df.columns if c.lower() == candidate), None)
        if matched:
            return matched
    return None


def _explicit_severity_distribution(df: pd.DataFrame) -> dict[str, int]:
    """Return severity distribution only when explicitly present in CSV columns."""
    for candidate in ["severity", "priority", "sev", "pri", "urgency", "impact"]:
        matched = next((c for c in df.columns if c.lower() == candidate), None)
        if matched:
            counts = Counter()
            for raw in df[matched].astype(str).fillna("").tolist():
                value = raw.strip().lower()
                if not value:
                    continue
                if any(tag in value for tag in ["critical", "sev1", "p1", "blocker"]):
                    counts["Critical"] += 1
                elif any(tag in value for tag in ["high", "sev2", "p2", "major"]):
                    counts["High"] += 1
                elif any(tag in value for tag in ["medium", "med", "sev3", "p3", "moderate"]):
                    counts["Medium"] += 1
                elif any(tag in value for tag in ["low", "minor", "sev4", "p4"]):
                    counts["Low"] += 1
                else:
                    counts["Medium"] += 1
            return dict(counts)
    return {}


def _infer_severity_label(text: str) -> str:
    """Infer ticket severity from free-text description alone."""
    t = (text or "").lower()

    critical_terms = {
        "sev1", "p1", "critical", "outage", "system down", "production down", "data breach",
        "breach", "ransomware", "malware outbreak", "unauthorized access", "cannot access",
        "all users", "company-wide", "site down", "service unavailable", "hard down",
    }
    high_terms = {
        "sev2", "p2", "urgent", "major", "high priority", "blocked", "blocking",
        "payment failed", "database locked", "deadlock", "degraded", "timeout",
        "escalated", "security incident", "cannot login", "vpn down", "email down",
    }
    medium_terms = {
        "sev3", "p3", "intermittent", "slow", "lag", "delay", "warning", "retry",
        "reopen", "inconsistent", "partial failure", "degraded performance", "workaround",
    }
    low_terms = {
        "sev4", "p4", "minor", "cosmetic", "typo", "ui", "enhancement", "feature request",
        "how to", "question", "training", "documentation", "request", "informational",
    }

    if any(term in t for term in critical_terms):
        return "Critical"
    if any(term in t for term in high_terms):
        return "High"
    if any(term in t for term in medium_terms):
        return "Medium"
    if any(term in t for term in low_terms):
        return "Low"
    return "Medium"


def _infer_severity_distribution(df: pd.DataFrame) -> dict[str, int]:
    """
    Build severity distribution.
    Priority order:
      1) Explicit severity/priority-like column if present.
      2) Free-text description inference when explicit severity is absent.
    """
    for candidate in ["severity", "priority", "sev", "pri", "urgency", "impact"]:
        matched = next((c for c in df.columns if c.lower() == candidate), None)
        if matched:
            counts = Counter()
            for raw in df[matched].astype(str).fillna("").tolist():
                value = raw.strip().lower()
                if not value:
                    continue
                if any(tag in value for tag in ["critical", "sev1", "p1", "blocker"]):
                    counts["Critical"] += 1
                elif any(tag in value for tag in ["high", "sev2", "p2", "major"]):
                    counts["High"] += 1
                elif any(tag in value for tag in ["medium", "med", "sev3", "p3", "moderate"]):
                    counts["Medium"] += 1
                elif any(tag in value for tag in ["low", "minor", "sev4", "p4"]):
                    counts["Low"] += 1
                else:
                    counts["Medium"] += 1
            if counts:
                return dict(counts)

    text_col = _find_text_column(df)
    if not text_col:
        return {}

    counts = Counter()
    for val in df[text_col].astype(str).fillna("").tolist():
        label = _infer_severity_label(val)
        counts[label] += 1
    return dict(counts)


# ── Heuristic categorisation ──────────────────────────────────────────────────

def _heuristic_issue_counts(df: pd.DataFrame) -> list[dict]:
    """Bucket every CSV row into an issue category using column names and keywords."""
    header = [str(h).strip().lower() for h in df.columns]
    category_idx = next(
        (i for i, col in enumerate(header) if col in {"category", "issue category", "issue_type", "issue type", "type"}),
        -1,
    )
    summary_idx = next(
        (i for i, col in enumerate(header) if col in {"issue", "summary", "description", "subject", "ticket"}),
        -1,
    )

    # OpsForge will look for keywords in the summary/description to classify tickets into categories
    keyword_groups = [
        ("Login Issues", ["login", "sign in", "signin", "credentials", "password"]),
        ("Account Management", ["account", "locked", "unlock", "username", "profile", "deprovision", "provision"]),
        ("Email / Messaging", ["email", "outlook", "exchange", "mailbox", "smtp", "teams", "slack", "message"]),
        ("Security / Compliance", ["security", "phish", "malware", "virus", "breach", "mfa", "2fa", "compliance", "audit"]),
        ("Hardware", ["laptop", "desktop", "monitor", "keyboard", "mouse", "dock", "battery", "device", "hardware"]),
        ("Software / Application", ["application", "app", "software", "update", "patch", "version", "license", "plugin"]),
        ("Database", ["database", "db", "sql", "query", "deadlock", "index", "replication", "schema"]),
        ("API / Integration", ["api", "integration", "webhook", "endpoint", "token", "oauth", "sso", "connector"]),
        ("Storage / Backup", ["storage", "disk", "backup", "restore", "retention", "filesystem", "capacity"]),
        ("Printing", ["printer", "print", "toner", "paper jam", "spool", "scanner"]),
        ("Billing / Subscription", ["billing", "invoice", "payment", "subscription", "renewal", "charge", "refund"]),
        ("Reporting / Analytics", ["report", "dashboard", "analytics", "metric", "kpi", "export", "csv"]),
        ("User Interface", ["ui", "ux", "button", "dropdown", "layout", "screen", "display", "visual"]),
        ("Mobile", ["mobile", "ios", "android", "iphone", "ipad", "tablet", "app crash"]),
        ("Data Quality", ["duplicate", "missing", "null", "incomplete", "invalid", "mismatch", "inconsistent"]),
        ("Performance", ["slow", "lag", "delay", "performance", "timeout"]),
        ("Errors", ["error", "fail", "failure", "exception", "crash", "bug"]),
        ("Setup / Access", ["access", "setup", "install", "permission", "configure"]),
        ("Network", ["network", "wifi", "connection", "latency", "vpn"]),
    ]
    
    counts: Counter[str] = Counter()
    # Loop through each row in the DataFrame and classify it into a category
    for values in df.astype(str).values.tolist():
        category = "Other"
        if category_idx >= 0 and category_idx < len(values) and values[category_idx].strip():
            category = values[category_idx].strip()
        else:
            source_text = ""
            if summary_idx >= 0 and summary_idx < len(values):
                source_text = values[summary_idx].lower()
            if not source_text:
                source_text = " ".join(values).lower()
            for name, keywords in keyword_groups:
                if any(keyword in source_text for keyword in keywords):
                    category = name
                    break
        counts[category] += 1

    return [{"issue": issue, "count": count} for issue, count in counts.most_common()]


# ── Health scoring ────────────────────────────────────────────────────────────

def _heuristic_health(issue_counts: list[dict], metrics: dict) -> tuple[int, str]:
    """
    Compute an organisational health score (0-100) and label without calling the AI.
    Used both as a fallback and to validate the AI's score.
    """
    total_rows = metrics.get("rows", 1) or 1
    score = 100

    # Data quality penalties
    missing_pct = metrics.get("missing_values", 0) / max(total_rows, 1)
    score -= min(20, round(missing_pct * 150))

    dup_pct = metrics.get("duplicate_rows", 0) / max(total_rows, 1)
    score -= min(15, round(dup_pct * 120))

    # Category concentration — one dominant problem category signals systemic failure
    if issue_counts:
        top_count = issue_counts[0]["count"]
        concentration = top_count / total_rows
        if concentration > 0.7:
            score -= 35
        elif concentration > 0.5:
            score -= 25
        elif concentration > 0.35:
            score -= 15
        elif concentration > 0.2:
            score -= 8

    # Critical / warning keyword penalties weighted by category share
    critical_keywords = {"error", "failure", "critical", "crash", "outage", "down", "breach",
                         "escalat", "urgent", "p1", "sev1"}
    warning_keywords = {"slow", "timeout", "lag", "delay", "unresolv", "reopen", "escalat", "complaint"}
    for item in issue_counts:
        name = item["issue"].lower()
        weight = item["count"] / total_rows
        if any(kw in name for kw in critical_keywords):
            score -= min(20, round(weight * 60))
        elif any(kw in name for kw in warning_keywords):
            score -= min(10, round(weight * 30))

    # Severity-weighted penalties (works even without explicit severity columns via text inference)
    severity_dist = metrics.get("severity_distribution", {})
    if isinstance(severity_dist, dict) and severity_dist:
        critical_count = int(severity_dist.get("Critical", 0) or 0)
        high_count = int(severity_dist.get("High", 0) or 0)
        medium_count = int(severity_dist.get("Medium", 0) or 0)
        low_count = int(severity_dist.get("Low", 0) or 0)

        severity_weighted = (critical_count * 4.0) + (high_count * 2.2) + (medium_count * 1.0) + (low_count * 0.35)
        severity_ratio = severity_weighted / max(total_rows, 1)
        score -= min(55, round(severity_ratio * 18))

        critical_share = critical_count / max(total_rows, 1)
        high_share = high_count / max(total_rows, 1)
        if critical_share >= 0.30:
            score -= 20
        elif critical_share >= 0.18:
            score -= 12

        if high_share >= 0.45:
            score -= 12
        elif high_share >= 0.30:
            score -= 7

    # Category diversity — many distinct broken things signals scattered, unaddressed issues
    num_categories = len(issue_counts)
    if num_categories >= 8:
        score -= 10
    elif num_categories >= 5:
        score -= 5

    score = max(0, min(100, score))

    if score >= 80:
        label = "Excellent"
    elif score >= 65:
        label = "Good"
    elif score >= 45:
        label = "Fair"
    elif score >= 25:
        label = "At Risk"
    else:
        label = "Critical"
    return score, label


# ── Text builders (fallback output when AI is unavailable) ────────────────────

def _build_report_text(issue_counts: list[dict], total_rows: int) -> str:
    """Generate a plain-text report summary from heuristic category counts."""
    top_three = issue_counts[:3]
    lines = [
        f"Processed {total_rows} CSV {'row' if total_rows == 1 else 'rows'} successfully.",
        f"Detected {len(issue_counts)} issue category {'type' if len(issue_counts) == 1 else 'types'}.",
        "Top categories:",
    ]
    for item in top_three:
        lines.append(f"- {item['issue']}: {item['count']}")
    return "\n".join(lines)


def _build_fallback_advice(issue_counts: list[dict], metrics: dict) -> str:
    """Generate rule-based organisational advice when the AI model is unavailable or too generic."""
    total_rows = max(1, int(metrics.get("rows", 0) or 0))

    def _action_for_category(category_name: str) -> str:
        c = category_name.lower()
        if any(k in c for k in ["login", "password", "auth", "credential", "access"]):
            return "prioritize SSO and self-service password reset with MFA enforcement"
        if any(k in c for k in ["error", "crash", "failure", "exception", "outage"]):
            return "create a top-error runbook and assign engineering owners for permanent fixes"
        if any(k in c for k in ["network", "vpn", "wifi", "latency", "connect"]):
            return "review network telemetry by site and add alerting on packet loss/latency spikes"
        if any(k in c for k in ["slow", "performance", "timeout", "lag"]):
            return "set response-time SLOs and investigate the highest-latency services first"
        if any(k in c for k in ["setup", "install", "permission", "onboard", "provision"]):
            return "standardize onboarding checklists and automate role-based provisioning"
        return "run a focused root-cause review and publish one corrective action per week"

    advice_lines: list[str] = []
    top = issue_counts[:4]

    if top:
        for item in top:
            count = int(item.get("count", 0))
            category = str(item.get("issue", "Other"))
            pct = round((count / total_rows) * 100, 1)
            action = _action_for_category(category)
            advice_lines.append(
                f"{category} accounts for {count} tickets ({pct}% of total) — {action}."
            )
    else:
        advice_lines.append(
            "No dominant issue category was detected — enforce category tagging in intake to improve targeting."
        )

    duplicate_rows = int(metrics.get("duplicate_rows", 0) or 0)
    missing_values = int(metrics.get("missing_values", 0) or 0)
    if duplicate_rows > 0:
        dup_pct = round((duplicate_rows / total_rows) * 100, 1)
        advice_lines.append(
            f"Duplicate records are {duplicate_rows} rows ({dup_pct}%) — add deduplication rules before analytics exports."
        )
    if missing_values > 0:
        advice_lines.append(
            f"There are {missing_values} missing field values — make category, severity, and status required fields in ticket forms."
        )

    severity_summary = metrics.get("severity_distribution", {})
    if isinstance(severity_summary, dict) and severity_summary:
        top_sev = max(severity_summary.items(), key=lambda kv: kv[1])
        advice_lines.append(
            f"Most common severity is '{top_sev[0]}' ({top_sev[1]} tickets) — rebalance triage capacity to that queue."
        )

    # Keep response concise and consistent with UI
    advice_lines = advice_lines[:8]
    return "\n".join(f"• {line}" for line in advice_lines)


def _advice_is_too_generic(advice_lines: list[str], issue_counts: list[dict]) -> bool:
    """Reject advice that does not reference concrete categories or dataset statistics."""
    if not advice_lines:
        return True

    top_categories = [str(item.get("issue", "")).lower() for item in issue_counts[:6] if item.get("issue")]
    specific_lines = 0
    for line in advice_lines:
        text = line.lower()
        has_number = any(ch.isdigit() for ch in text) or "%" in text
        has_category = any(cat and cat in text for cat in top_categories)
        if has_number or has_category:
            specific_lines += 1

    # Require most lines to be tied to the current dataset
    required_specific = max(2, (len(advice_lines) * 2) // 3)
    return specific_lines < required_specific


# ── Structured data summary (sent to the AI instead of raw rows) ──────────────

def _build_data_summary(df: pd.DataFrame, metrics: dict, issue_counts: list[dict]) -> dict:
    """
    Pre-compute a rich analytical summary of the CSV so the AI receives clear,
    structured signal rather than an unordered blob of raw rows.
    """
    total_rows = metrics.get("rows", 1) or 1

    category_breakdown = [
        {
            "category": item["issue"],
            "count": item["count"],
            "pct_of_total": round(item["count"] / total_rows * 100, 1),
        }
        for item in issue_counts
    ]

    # Locate the most descriptive text column for keyword extraction
    text_col = _find_text_column(df)

    # Top 30 ticket keywords (stop-word filtered)
    top_keywords: list[str] = []
    stop_words = {
        "the", "a", "an", "is", "in", "on", "at", "to", "for", "of", "and", "or",
        "with", "was", "are", "be", "been", "has", "had", "have", "not", "no",
        "i", "we", "my", "our", "it", "its", "this", "that", "by", "from", "unknown",
    }
    if text_col:
        word_counter: Counter[str] = Counter()
        for val in df[text_col].astype(str).str.lower().values:
            for word in val.split():
                word = word.strip(".,;:!?\"'()")
                if len(word) > 3 and word not in stop_words:
                    word_counter[word] += 1
        top_keywords = [w for w, _ in word_counter.most_common(30)]

    # Severity distribution only when explicitly provided by the CSV.
    # If empty, AI is expected to infer severity from sample ticket descriptions.
    severity_dist: dict = _explicit_severity_distribution(df)

    # Status / resolution distribution
    status_dist: dict = {}
    for candidate in ["status", "state", "resolution", "resolved"]:
        matched = next((c for c in df.columns if c.lower() == candidate), None)
        if matched:
            status_dist = df[matched].astype(str).value_counts().to_dict()
            break

    # Numeric column highlights (e.g. resolution time averages)
    numeric_highlights: dict = {}
    for col in metrics.get("numeric_columns", []):
        stats = metrics.get("statistics", {}).get(col, {})
        if stats:
            numeric_highlights[col] = stats

    # Up to 25 sample ticket descriptions bucketed by category
    sample_tickets: list[str] = []
    if text_col:
        per_cat = max(3, 25 // max(len(issue_counts), 1))
        for item in issue_counts[:8]:
            cat_name = item["issue"]
            mask = df.astype(str).apply(
                lambda row: cat_name.lower() in " ".join(row.values).lower(), axis=1
            )
            samples = df[mask][text_col].astype(str).head(per_cat).tolist()
            sample_tickets.extend([f"[{cat_name}] {t}" for t in samples])
        sample_tickets = sample_tickets[:25]

    return {
        "total_rows": total_rows,
        "columns": list(df.columns),
        "category_breakdown": category_breakdown,
        "top_keywords_in_tickets": top_keywords,
        "severity_distribution": severity_dist,
        "severity_inference_required": not bool(severity_dist),
        "status_distribution": status_dist,
        "numeric_stats": numeric_highlights,
        "missing_values": metrics.get("missing_values", 0),
        "duplicate_rows": metrics.get("duplicate_rows", 0),
        "sample_tickets": sample_tickets,
    }


# ── GPT-4o-mini interpretation ────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are a senior IT operations analyst. You have been given a structured analytical summary "
    "of a helpdesk / operations ticket dataset. Your job is to:\n\n"
    "1. Classify tickets into meaningful categories based on the data provided.\n"
    "2. Score organizational health from 0 (critical failure) to 100 (excellent), "
    "using the following scale strictly: "
    "0-24 = Critical, 25-44 = At Risk, 45-64 = Fair, 65-79 = Good, 80-100 = Excellent. "
    "The score MUST reflect the actual severity distribution, category concentration, "
    "volume of critical/error tickets, unresolved status rates, and data quality. "
    "If severity/risk columns are missing, infer severity directly from ticket descriptions "
    "and language in sample tickets (e.g., outages, breaches, all-users-blocked, failed payments, etc.). "
    "Do not assume severity is unknown just because the CSV has no risk/severity column. "
    "Two different datasets MUST receive different scores if their distributions differ. "
    "A dataset dominated by 'Errors' or 'Crashes' should score lower than one with "
    "'Setup' or 'How-To' questions. Never default to the same score across calls.\n"
    "3. Write 5-8 pieces of advice that are SPECIFIC to THIS dataset — mention the actual "
    "category names, counts, and percentages from the data. Do NOT give generic advice. "
    "For example: 'Login Issues account for 42% of tickets — implement SSO to reduce manual "
    "credential resets' is specific. 'Improve login process' is too vague and unacceptable.\n\n"
    "Return strict JSON with exactly these keys:\n"
    "- report_summary: 2-3 sentence summary referencing the actual top categories and counts\n"
    "- categories: array of {issue: string, count: number} — inferred from the data\n"
    "- advice: array of 5-8 strings, each one MUST reference specific category names or stats\n"
    "- health_score: integer 0-100 per the scale above\n"
    "- health_label: exactly one of: Critical | At Risk | Fair | Good | Excellent"
)


def _ai_interpretation(df: pd.DataFrame, metrics: dict) -> tuple[str, list[dict], str, int, str] | None:
    """
    Call GPT-4o-mini with a structured data summary and parse the response.
    Returns (report_summary, categories, advice_text, health_score, health_label)
    or None if the API key is missing or the call fails.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[OpsForge] No OPENAI_API_KEY found — using heuristic fallback.", file=sys.stderr)
        return None

    client = OpenAI(api_key=api_key)
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    print(f"[OpsForge] Calling {model_name} with {len(df)} rows...", file=sys.stderr)

    heuristic_counts = _heuristic_issue_counts(df)
    summary = _build_data_summary(df, metrics, heuristic_counts)
    # Enrich fallback path with AI summary context when available
    metrics_for_fallback = {**metrics, "severity_distribution": summary.get("severity_distribution", {})}

    try:
        completion = client.chat.completions.create(
            model=model_name,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(summary)},
            ],
        )
        content = completion.choices[0].message.content or "{}"
        parsed = json.loads(content)

        # Parse categories
        categories = parsed.get("categories", [])
        cleaned_categories: list[dict] = []
        if isinstance(categories, list):
            for item in categories:
                if not isinstance(item, dict):
                    continue
                issue = str(item.get("issue", "")).strip()
                try:
                    count = int(item.get("count", 0))
                except (TypeError, ValueError):
                    count = 0
                if issue and count > 0:
                    cleaned_categories.append({"issue": issue, "count": count})

        if not cleaned_categories:
            cleaned_categories = heuristic_counts

        cleaned_categories.sort(key=lambda x: x["count"], reverse=True)

        # Parse report summary
        report_summary = (
            str(parsed.get("report_summary", "")).strip()
            or _build_report_text(cleaned_categories, len(df))
        )

        # Parse advice — trust the model directly; only fall back if completely empty
        advice = parsed.get("advice", [])
        advice_lines = [
            str(line).strip()
            for line in (advice if isinstance(advice, list) else [])
            if str(line).strip()
        ]
        if advice_lines:
            advice_text = "\n".join(f"• {line}" for line in advice_lines)
        else:
            advice_text = _build_fallback_advice(cleaned_categories, metrics_for_fallback)

        # Parse health score
        try:
            health_score = max(0, min(100, int(parsed.get("health_score", 0))))
        except (TypeError, ValueError):
            health_score, _ = _heuristic_health(cleaned_categories, metrics)

        # Parse health label
        valid_labels = {"Critical", "At Risk", "Fair", "Good", "Excellent"}
        health_label = str(parsed.get("health_label", "")).strip()
        if health_label not in valid_labels:
            _, health_label = _heuristic_health(cleaned_categories, metrics)

        return report_summary, cleaned_categories, advice_text, health_score, health_label

    except Exception as exc:
        print(f"[OpsForge] AI interpretation failed: {exc}", file=sys.stderr)
        return None


# ── Public entry point ────────────────────────────────────────────────────────

def interpret_csv(df: pd.DataFrame, metrics: dict) -> dict:
    """
    Main entry point called by main.py.
    Tries AI interpretation first; falls back to heuristics if unavailable.
    Returns a dict with: report_text, issue_counts, advice, health_score,
                         health_label, model_used.
    """
    ai_result = _ai_interpretation(df, metrics)

    if ai_result:
        report_text, issue_counts, advice_text, health_score, health_label = ai_result
        model_used = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    else:
        # Fallback remains deterministic when model is unavailable.
        metrics_for_scoring = {**metrics, "severity_distribution": _infer_severity_distribution(df)}
        issue_counts = _heuristic_issue_counts(df)
        report_text = _build_report_text(issue_counts, len(df))
        advice_text = _build_fallback_advice(issue_counts, metrics_for_scoring)
        health_score, health_label = _heuristic_health(issue_counts, metrics_for_scoring)
        model_used = "heuristic-fallback"

    return {
        "report_text": report_text,
        "issue_counts": issue_counts,
        "advice": advice_text,
        "health_score": health_score,
        "health_label": health_label,
        "model_used": model_used,
    }
