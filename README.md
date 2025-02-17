<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

<span align="center">

# Homebridge Platform Plugin Template

</span>

> [!IMPORTANT] > **Homebridge v2.0 Information**
>
> This template currently has a
>
> - `package.json -> engines.homebridge` value of `"^1.8.0 || ^2.0.0-beta.0"`
> - `package.json -> devDependencies.homebridge` value of `"^2.0.0-beta.0"`
>
> This is to ensure that your plugin will build and run on both Homebridge v1 and v2.
>
> Once Homebridge v2.0 has been released, you can remove the `-beta.0` in both places.

---

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

```json
{
  "name": "homebridge-epson-powerstate",
  "platform": "EpsonPowerState",
  "devices": [
    {
      "name": "My Epson Projector",
      "ip": "192.168.1.99",
      "useChromecast": true,
      "chromecastName": "Android TV" // must match the name of the chromecast device in the network
    }
  ]
}
```

### Troubleshooting

For any developers who want to run this - the most common error occuring when trying to run `npm run watch` locally will be that the `config` plugin is not found. I never found out the proper way to solve that, so my workaround is:

1. Add this line to the package.json in "devDependencies"

```json
    "homebridge-config-ui-x": "^4.71.0",
```

2. Run `npm i` to install it locally, discard the changes in package.json again

3. Run `npm run watch` and have fun developing :-)
