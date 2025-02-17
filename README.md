<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

<span align="center">

## Installation

Use the webinterface and search for `homebridge-epson-powerstate`, install the plugin as usual.

### Example configuration

You can use a simple variant trough polling the built-in webinterface of epson projectors.
Wroks with almost all models but it's a bit slow:

```json
{
  "name": "homebridge-epson-powerstate",
  "platform": "EpsonPowerState",
  "devices": [
    {
      "name": "My Epson Projector",
      "ip": "192.168.1.99"
    }
  ]
}
```

When your epson projector has a built-in chromecast, you can change the configuration to this:

| Just turn `useChromecast` to true and use "Android TV" as `chromecastName`. If your chrome cast has a different name, you will see it in the plugin logs - it will be something different than `Unknown Device`.

```json
{
  "name": "homebridge-epson-powerstate",
  "platform": "EpsonPowerState",
  "devices": [
    {
      "name": "My Epson Projector",
      "ip": "192.168.1.99",
      "useChromecast": true,
      "chromecastName": "Android TV"
    }
  ]
}
```

### Troubleshooting Development

For any developers who want to run this - the most common error occuring when trying to run `npm run watch` locally will be that the `config` plugin is not found. I never found out the proper way to solve that, so my workaround is:

1. Add this line to the package.json in "devDependencies"

```json
    "homebridge-config-ui-x": "^4.71.0",
```

2. Run `npm i` to install it locally, discard the changes in package.json again

3. Run `npm run watch` and have fun developing :-)
