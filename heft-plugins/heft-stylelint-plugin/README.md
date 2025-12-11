# Heft Stylelint Plugin

Plugin package for linting stylesheets with [Stylelint](https://stylelint.io/) with [Heft](https://heft.rushstack.io).

> This project is currently under development, but it works as is. The published version `@latest` does not work. The current working version (*but still under development*) is available under the `@next` distribution tag.

## Installation

1. Install the plugin package in your project as a dev dependency:

    ```console
    npm install @voitanos/heft-stylelint-plugin --save-dev
    ```

1. Add the plugin to an existing and/or new Heft phrase. For example, the following **./config/heft.json** will add it to an existing **build** phase and create a new **stylelint** phase.

    ```json
    {
      "$schema": "https://developer.microsoft.com/json-schemas/heft/v0/heft.schema.json",
      "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/heft.json",
      "phasesByName": {
        "build": {
          "tasksByName": {
            "stylelint-plugin": {
              "taskDependencies": [ "sass" ],
              "taskPlugin": {
                "pluginPackage": "@voitanos/heft-stylelint-plugin"
              }
            }
          }
        },
        "stylelint-phase": {
          "tasksByName": {
            "stylelint-plugin": {
              "taskPlugin": {
                "pluginPackage": "@voitanos/heft-stylelint-plugin",
                "pluginName": "stylelint-plugin"
              }
            }
          }
        }
      }
    }
    ```

1. Add a stylelint configuration file to the root of the project: **./.stylelintrc**

    ```txt
    {
      "extends": "stylelint-config-standard",
      "plugins": [
        "stylelint-scss"
      ],
      "rules": {
        "at-rule-no-unknown": null,
        "scss/at-rule-no-unknown": true,

        "value-list-comma-space-after": "always-single-line",
        "declaration-empty-line-before": "never"
      }
    }
    ```
