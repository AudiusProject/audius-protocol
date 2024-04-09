{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": $header,
        "emoji": true
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": $author
        },
        {
          "type": "mrkdwn",
          "text": $branch
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": $commit
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": $workflows
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": $summary
      }
    }
  ]
}
