import { useAzureMonitor } from "@azure/monitor-opentelemetry";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

export function addTelemetry() {
  // See also https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable?tabs=nodejs
  useAzureMonitor();

  // See also https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node
  registerInstrumentations({
    instrumentations: [
        getNodeAutoInstrumentations()
    ]
  });
}
