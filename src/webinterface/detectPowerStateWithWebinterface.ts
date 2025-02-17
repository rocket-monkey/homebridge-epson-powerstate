import http from "http";

export function detectPowerStateWithWebinterface(
  ipAddress: string,
  timeout = 2000
): Promise<{
  isOn: boolean;
  state: string;
  statusCode?: number;
  error?: Error;
}> {
  return new Promise((resolve) => {
    const request = http.get(
      `http://${ipAddress}`,
      {
        timeout: timeout,
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          // Most Epson projectors include the text "EPSON" or "Web Control" in their web interface
          const isProbablyOn =
            data.includes("EPSON") || data.includes("Web Control");
          resolve({
            isOn: isProbablyOn,
            state: isProbablyOn
              ? "Responding to web interface"
              : "Unexpected response",
            statusCode: response.statusCode,
          });
        });
      }
    );

    request.on("error", (error) => {
      resolve({
        isOn: false,
        state: `Web interface not accessible: ${error.message}`,
        error: error,
      });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve({
        isOn: false,
        state: "Web interface timeout",
      });
    });
  });
}
