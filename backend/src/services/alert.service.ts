import { Alert, IAlert } from "../models/Alert.js";

export interface CreateAlertParams {
  astronautId: string;
  title: string;
  description: string;
  severity: "Normal" | "Watch" | "Warning" | "Critical";
  signal?: string;
  value?: number | string;
  baseline?: number | string;
}

export class AlertService {
  /**
   * Create an alert in the database
   */
  public static async createAlert(params: CreateAlertParams): Promise<IAlert> {
    return await Alert.create({
      astronautId: params.astronautId,
      title: params.title,
      description: params.description,
      severity: params.severity,
      signal: params.signal,
      value: params.value,
      baseline: params.baseline,
      resolved: false,
    });
  }

  /**
   * Get all alerts with optional filtering
   */
  public static async getAlerts(filter: {
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }): Promise<IAlert[]> {
    const query: any = {};

    if (filter.severity && filter.severity !== "All") {
      query.severity = filter.severity;
    }

    if (typeof filter.resolved === "boolean") {
      query.resolved = filter.resolved;
    }

    const limit = filter.limit || 50;
    return await Alert.find(query).sort({ createdAt: -1 }).limit(limit);
  }

  /**
   * Get alerts for a specific astronaut
   */
  public static async getAlertsByAstronaut(astronautId: string): Promise<IAlert[]> {
    return await Alert.find({ astronautId }).sort({ createdAt: -1 });
  }

  /**
   * Mark an alert as resolved
   */
  public static async resolveAlert(id: string): Promise<IAlert | null> {
    return await Alert.findByIdAndUpdate(
      id,
      {
        resolved: true,
        resolvedAt: new Date(),
      },
      { new: true }
    );
  }
}
