#!/usr/bin/env python3

import json
import re
from string import ascii_uppercase

import click


def sanatize_text(string):
    result = string.replace('"', '\\"')
    result = string.replace("\n", "\\n")
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


@click.command()
@click.help_option("-h", "--help")
@click.argument("filename")
def main(filename):
    """Convert all dashboard thresholds into alerts."""
    click.echo(filename)
    with open("grafana/alerts/alert.template.json") as f:
        template = f.read()
    with open(filename) as f:
        dashboard = json.loads(f.read())

    dashboard_id = dashboard["dashboard"]["id"]
    if not dashboard_id:
        print("Please run this instead: ./grafana/bin/extract-alerts.sh")
        exit(1)

    dashboard_uid = dashboard["dashboard"]["uid"]
    dashboard_title = dashboard["dashboard"]["title"]
    for panel in dashboard["dashboard"]["panels"]:
        panel_id = panel["id"]
        runbook_url = f"http://grafana.audius.co/d/{dashboard_uid}?viewPanel={panel_id}"

        description = ""
        summary = ""
        if "description" in panel:
            description = sanatize_text(panel["description"])
            if "---" in description:
                summary, description = description.split("---")
                summary = summary.strip()
                description = description.strip()

        if "fieldConfig" in panel:
            if panel["type"] != "timeseries":
                continue

            panel_alerts = []
            for step in panel["fieldConfig"]["defaults"]["thresholds"]["steps"]:
                # skip the base case when value is not set, nor visible
                if not "value" in step or step["value"]:
                    continue

                # ensure thresholds are visible
                visible_threshold = False
                if "custom" in panel["fieldConfig"]["defaults"]:
                    custom_key = panel["fieldConfig"]["defaults"]["custom"]
                    visible_threshold = custom_key["thresholdsStyle"]["mode"] == "line"
                if not visible_threshold:
                    continue

                # map colors to alert level
                if "red" in step["color"]:
                    level = "high-alert"
                    level_id = 1
                elif "orange" in step["color"]:
                    level = "medium-alert"
                    level_id = 2
                elif "yellow" in step["color"]:
                    level = "low-alert"
                    level_id = 3
                elif "green" in step["color"]:
                    level = "notification"
                    level_id = 4
                else:
                    break

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
                    if "hide" in panel["targets"] and panel["targets"]["hide"]:
                        break

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
                                "expr": sanatize_text(target["expr"]),
                                "hide": False,
                                "intervalMs": 1000,
                                "maxDataPoints": 43200,
                                "refId": ref_ids[-1],
                            },
                        }
                    )

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

                title_level = level.split("-")[0].title()
                alert_uid = f"{dashboard_uid}_{panel_id:03}_{title_level}"
                title = sanatize_text(panel["title"])
                title = f"{title} ({title_level})"
                formatted_text = template.format(
                    alert_id=(dashboard_id * 10000)
                    + (panel_id * 10)
                    + level_id
                    + 100000,
                    alert_uid=alert_uid,
                    dashboard_uid=dashboard_uid,
                    panel_id=panel_id,
                    datasource_uid="r2_nnDL7z",
                    title=title,
                    runbook_url=runbook_url,
                    description=description,
                    summary=summary,
                    level=level,
                    condition_ref=ref_ids[-1],
                    data=json.dumps(data),
                )
                panel_alerts.append(json.loads(formatted_text))

            if panel_alerts:
                dashboard = generate_filename_from_title(dashboard_title)
                title = generate_filename_from_title(panel["title"])
                with open(f"grafana/alerts/{dashboard}_{title}.json", "w") as f:
                    f.write(json.dumps(panel_alerts, indent=2, sort_keys=True))
    return


if __name__ == "__main__":
    main()
