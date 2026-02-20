# Mixpanel Analytics Setup Guide

## Account Setup

1. Create a free Mixpanel account at https://mixpanel.com
2. Create a new project named "mmmh-mobile"
3. Copy the project token and set it in `app.json` → `expo.extra.mixpanelToken`
4. Data retention is 90 days on the free tier (default)

## Key Metrics Dashboard

Create a dashboard named "mmmh Overview" with these reports:

### DAU / WAU

- **Insight type:** Insights
- **Event:** "App Opened"
- **Group by:** Day / Week
- **Chart type:** Line

### Import Success Rate

- **Insight type:** Insights
- **Events:** "Import Succeeded" and "Import Failed"
- **Formula:** Import Succeeded / (Import Succeeded + Import Failed)
- **Chart type:** Line

### Quota Exhaustion

- **Insight type:** Insights
- **Event:** "Quota Reached"
- **Breakdown:** `quota_type` (vps / gemini)
- **Chart type:** Bar

### Catalog Size Distribution

- **Insight type:** Insights
- **User property:** `recipes_count`
- **Chart type:** Bar (bucketed)

### Trial Conversion Rate

- **Insight type:** Insights
- **Formula:** "Plan Upgraded" unique users / "Trial Started" unique users
- **Time period:** Last 30 days

## Funnels

### Import Funnel

1. "Import Started"
2. "Import Succeeded"
3. "Recipe Created" (saved from import)

### Trial Conversion Funnel

1. "Trial Started"
2. "Import Succeeded" (at least one import during trial)
3. "Plan Upgraded"

## User Properties Tracked

| Property        | Description               |
| --------------- | ------------------------- |
| `device_type`   | iOS or Android            |
| `os_version`    | OS version string         |
| `app_version`   | App version from app.json |
| `recipes_count` | Total recipes in catalog  |
| `plan_tier`     | free, trial, or premium   |

## Events Reference

| Event            | Properties                                 | Trigger                    |
| ---------------- | ------------------------------------------ | -------------------------- |
| App Opened       | —                                          | App launch                 |
| Screen Viewed    | `screen_name`                              | Navigation change          |
| Recipe Created   | `recipe_id`, `source`                      | Manual create              |
| Recipe Imported  | `recipe_id`, `import_type`                 | Import saved               |
| Recipe Viewed    | `recipe_id`                                | Detail screen opened       |
| Recipe Edited    | `recipe_id`                                | Recipe updated             |
| Recipe Deleted   | `recipe_id`                                | Recipe removed             |
| Import Started   | `import_type`, `platform`                  | Import job submitted       |
| Import Succeeded | `import_type`, `pipeline`, `fallback_used` | Import completed           |
| Import Failed    | `import_type`, `error_code`                | Import error               |
| Quota Reached    | `quota_type`, `tier`                       | Quota exceeded modal shown |
| Settings Viewed  | —                                          | Menu screen opened         |
| Trial Started    | —                                          | Trial activated            |
| Trial Expired    | `date`, `totalImportsUsed`                 | Trial period ended         |
| Plan Upgraded    | `tier`                                     | Premium activated          |

## GDPR / Privacy

- Set `analyticsEnabled: false` in `app.json` extra config to disable all tracking
- Alternatively set `EXPO_PUBLIC_ANALYTICS_ENABLED=false` in environment
- No PII is collected — only anonymous device UUID and usage stats
