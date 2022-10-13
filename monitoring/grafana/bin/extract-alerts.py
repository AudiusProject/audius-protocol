#!/usr/bin/env python3

import json
import re
from string import ascii_uppercase

import click


def sanatize_text(string):
    result = string.replace('"', '\\"')
    result = result.replace("\n", "\\n")
    return result


def ref_id_generator():
    for c in ascii_uppercase:
        yield c


def generate_filename_from_title(title):
    title = re.sub("[^0-9a-zA-Z ]+", "", title)
    title = " ".join(title.split())
    title = re.sub(" ", "-", title)
    title = title.lower()
    return title


def extract_alerts(template, dashboard, env):
    dashboard_id = dashboard["dashboard"]["id"]
    dashboard_uid = dashboard["dashboard"]["uid"]
    dashboard_title = dashboard["dashboard"]["title"]
    for panel in dashboard["dashboard"]["panels"]:
        panel_id = panel["id"]
        runbook_url = f"http://grafana.audius.co/d/{dashboard_uid}?viewPanel={panel_id}"

        description = ""
        summary = ""
        if "description" in panel:
            description = panel["description"]
            if "---" in description:
                summary, description = description.split("---")
        description = description.strip()
        summary = summary.strip()

        if "fieldConfig" in panel:
            if panel["type"] != "timeseries":
                continue

            mentions = ""
            team = ""
            alert_on = []
            if "mappings" in panel["fieldConfig"]["defaults"]:
                for mapping in panel["fieldConfig"]["defaults"]["mappings"]:
                    for key, mapping in mapping["options"].items():
                        if key == "mentions":
                            mentions = mapping["text"]
                        elif key == "team":
                            team = mapping["text"]
                        elif key == "alert_on":
                            for ref_id in mapping["text"].split(","):
                                alert_on.append(ref_id.strip())

            if "links" in panel["fieldConfig"]["defaults"]:
                links = []
                for link in panel["fieldConfig"]["defaults"]["links"]:
                    links.append(f'<a href="{link["url"]}">{link["title"]}</a>')
                # do not use HTML until AlertManager allows formatted Slack messages
                # for link in links:
                #     summary += f"\n* {link}"

            panel_alerts = []
            for step in panel["fieldConfig"]["defaults"]["thresholds"]["steps"]:
                # skip the base case when value is not set, nor visible
                if "value" not in step or not step["value"]:
                    continue

                # ensure thresholds are visible and using Absolute
                visible_and_absolute = False
                if "custom" in panel["fieldConfig"]["defaults"]:
                    custom = panel["fieldConfig"]["defaults"]["custom"]
                    visible = custom["thresholdsStyle"]["mode"] == "line"

                    mode = panel["fieldConfig"]["defaults"]["thresholds"]["mode"]
                    absolute = mode == "absolute"

                    if visible and absolute:
                        visible_and_absolute = True
                if not visible_and_absolute:
                    continue

                # map colors to alert level
                if "red" in step["color"]:
                    level = "p1"
                    level_id = 1
                elif "orange" in step["color"]:
                    level = "p2"
                    level_id = 2
                elif "yellow" in step["color"]:
                    level = "p3"
                    level_id = 3
                elif "blue" in step["color"]:
                    level = "debug"
                    level_id = 5
                else:
                    continue

                # UI Ordering: dark, semi-dark, base, light, super-light
                # Conditional:          <=       >=
                if "dark" in step["color"]:
                    conditional = "lt"
                else:
                    conditional = "gt"

                data = []
                ref_ids = []
                ref_gen = ref_id_generator()

                for i, target in enumerate(panel["targets"]):
                    # ignore expr's that are hidden on the panel
                    # only what is readily visible is what will be alerted on
                    if "hide" in target and target["hide"]:
                        continue

                    # when the alert_on key appears within Value Mappings,
                    # only create alerts for the listed refIds
                    if alert_on and target["refId"] not in alert_on:
                        continue

                    # assume all metrics missing $env are Prod-only metrics
                    expression = target["expr"]
                    if "$env" not in expression and env != "prod":
                        continue

                    # create different alerts for stage and prod
                    expression = re.sub(r"\$env", env, expression)

                    # make all other regex matches be .* for alerts
                    expression = re.sub(r"\$[A-Za-z0-9_]+", ".*", expression)

                    ref_ids.append(next(ref_gen))
                    data.append(
                        {
                            "refId": ref_ids[-1],
                            "queryType": "",
                            "relativeTimeRange": {"from": 600, "to": 0},
                            "datasourceUid": "r2_nnDL7z",
                            "model": {
                                "datasource": {
                                    "type": "prometheus",
                                    "uid": "r2_nnDL7z",
                                },
                                "expr": expression,
                                "hide": False,
                                "intervalMs": 1000,
                                "maxDataPoints": 43200,
                                "refId": ref_ids[-1],
                            },
                        }
                    )

                # don't create alerts without alert conditions
                if not data:
                    continue

                alert_conditions = []
                for ref_id in ref_ids:
                    alert_condition = {
                        "evaluator": {
                            "params": [step["value"], 0],
                            "type": conditional,
                        },
                        "operator": {"type": "or"},
                        "query": {"params": [ref_id]},
                        "reducer": {"params": [], "type": "last"},
                        "type": "query",
                    }
                    alert_conditions.append(alert_condition)

                ref_ids.append(next(ref_gen))
                data.append(
                    {
                        "refId": ref_ids[-1],
                        "queryType": "",
                        "relativeTimeRange": {"from": 0, "to": 0},
                        "datasourceUid": "-100",
                        "model": {
                            "conditions": alert_conditions,
                            "datasource": {
                                "name": "Expression",
                                "type": "__expr__",
                                "uid": "__expr__",
                            },
                            "hide": False,
                            "intervalMs": 1000,
                            "maxDataPoints": 43200,
                            "refId": ref_ids[-1],
                            "type": "classic_conditions",
                        },
                    }
                )

                title_level = level.title()
                alert_uid = f"{dashboard_uid}_{panel_id:03}_{title_level}_{env}"

                # arbitrary, deterministic id generation with an offset to allow for
                # 100k manually created panels
                alert_id = (
                    (dashboard_id * 100000)
                    + (panel_id * 100)
                    + (level_id * 10)
                    + int(env == "prod")
                    + 100000
                )

                title = sanatize_text(panel["title"])
                title_env = env.upper()
                title = f"{title_env} {title_level} | {title}"

                labels = {
                    "alert": level,
                    "env": env,
                }
                if mentions:
                    labels["mentions"] = mentions
                if team:
                    labels["team"] = team

                formatted_text = template.format(
                    alert_id=alert_id,
                    alert_uid=alert_uid,
                    dashboard_uid=dashboard_uid,
                    panel_id=panel_id,
                    datasource_uid="r2_nnDL7z",
                    title=title,
                    runbook_url=runbook_url,
                    description=sanatize_text(description),
                    summary=sanatize_text(summary),
                    labels=json.dumps(labels),
                    condition_ref=ref_ids[-1],
                    data=json.dumps(data),
                )
                panel_alerts.append(json.loads(formatted_text))

            if panel_alerts:
                dashboard = generate_filename_from_title(dashboard_title)
                title = generate_filename_from_title(panel["title"])
                with open(f"grafana/alerts/{dashboard}_{title}-{env}.json", "w") as f:
                    f.write(json.dumps(panel_alerts, indent=2, sort_keys=True))


@click.command()
@click.help_option("-h", "--help")
@click.argument("filename")
def main(filename):
    """
    Convert all dashboard thresholds into alerts.

    Iterate over the dashboard keys to extract threshold values.
    Use these values in combination with alert.template.json to generate new alerts.
    Output all alerts from a panel into individual alerts/*.json files.
    """
    click.echo(filename)
    with open("grafana/metadata/alert.template.json") as f:
        template = f.read()
    with open(filename) as f:
        dashboard = json.loads(f.read())

    if not dashboard["dashboard"]["id"]:
        print("Please run this instead: ./grafana/bin/extract-alerts.sh")
        exit(1)

    for env in ("prod", "stage"):
        extract_alerts(template, dashboard, env)


if __name__ == "__main__":
    main()
