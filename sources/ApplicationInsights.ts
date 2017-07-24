import * as qub from "qub";
import * as telemetry from "qub-telemetry";
import * as appInsights from "applicationinsights";

/**
 * A telemetry endpoint that will send telemetry events to an Application Insights instance in
 * Azure.
 */
export class Telemetry extends telemetry.Endpoint {
    private _uploadImmediately: boolean;
    private _client: Client;

    constructor(options: { instrumentationKey: string, uploadImmediately?: boolean }) {
        super();

        appInsights.setup(options.instrumentationKey)
            .setAutoCollectRequests(false)
            .setAutoCollectPerformance(false)
            .setAutoCollectExceptions(false)
            .start();

        this._client = appInsights.client;
        this._uploadImmediately = options.uploadImmediately ? true : false;
    }

    public write(event: telemetry.Event): void {
        let properties: { [key: string]: string } = undefined;
        let measurements: { [key: string]: number } = undefined;

        for (let propertyName in event) {
            if (propertyName !== "eventName") {
                let propertyValue = event[propertyName];
                if (typeof propertyValue === "string" || typeof propertyValue === "boolean") {
                    if (!properties) {
                        properties = {};
                    }
                    properties[propertyName] = propertyValue.toString();
                }
                else if (typeof propertyValue === "number") {
                    if (!measurements) {
                        measurements = {};
                    }
                    measurements[propertyName] = propertyValue;
                }
            }
        }

        this._client.trackEvent(event.eventName, properties, measurements);

        if (this._uploadImmediately) {
            this._client.sendPendingData();
        }
    }
}