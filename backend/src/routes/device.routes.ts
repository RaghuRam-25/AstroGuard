import { Router, Request, Response } from "express";
import { AstronautDevice, IAstronautDevice } from "../models/AstronautDevice.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { TelemetryService } from "../services/telemetry.service.js";

const router = Router();

// Default device templates for astronaut setup
const DEFAULT_ASTRONAUT_DEVICES = (astronautId: string) => [
  {
    deviceId: `BP-${astronautId.replace(/[^A-Za-z0-9]/g, "")}-01`,
    astronautId,
    deviceType: "bio_patch",
    name: "Medical Bio-Patch Array",
    manufacturer: "AstroGuard BioMed Systems",
    model: "BioPatch-Pro X4",
    firmwareVersion: "v3.1.2-rtos",
    connectionType: "ble",
    status: "connected",
    batteryLevel: 87,
    signalStrength: "excellent",
    rssiDbm: -52,
    isSimulated: true,
    calibrationStatus: "Calibrated · Lead-II ECG Certified",
    assignedSensors: ["Optical PPG", "Differential Lead-II ECG", "Core NTC Thermistor", "Skin Impedance"],
  },
  {
    deviceId: `SW-${astronautId.replace(/[^A-Za-z0-9]/g, "")}-01`,
    astronautId,
    deviceType: "smartwatch",
    name: "Astronaut Tactical Smartwatch",
    manufacturer: "Orbital Dynamics Wearables",
    model: "AstroWatch Space-Edition",
    firmwareVersion: "v2.8.4",
    connectionType: "ble",
    status: "connected",
    batteryLevel: 72,
    signalStrength: "good",
    rssiDbm: -64,
    isSimulated: true,
    calibrationStatus: "Calibrated · 6-Axis IMU Actigraphy",
    assignedSensors: ["6-Axis Accelerometer/Gyroscope", "Wrist PPG", "Ambient Pressure/Barometer"],
  },
  {
    deviceId: `CGM-${astronautId.replace(/[^A-Za-z0-9]/g, "")}-01`,
    astronautId,
    deviceType: "cgm",
    name: "Continuous Glucose Monitor",
    manufacturer: "EndoSpace Therapeutics",
    model: "GlycoSense Micro-Probe",
    firmwareVersion: "v1.9.0",
    connectionType: "ble",
    status: "connected",
    batteryLevel: 91,
    signalStrength: "excellent",
    rssiDbm: -49,
    isSimulated: true,
    calibrationStatus: "Enzymatic Sensor Calibrated (Day 4/14)",
    assignedSensors: ["Subcutaneous Enzymatic Interstitial Glucose Sensor"],
  },
  {
    deviceId: `BPM-${astronautId.replace(/[^A-Za-z0-9]/g, "")}-01`,
    astronautId,
    deviceType: "bp_monitor",
    name: "Digital Hemodynamic BP Cuff",
    manufacturer: "AeroHealth MedTech",
    model: "PressuGrip-ZeroG",
    firmwareVersion: "v2.1.0",
    connectionType: "ble",
    status: "connected",
    batteryLevel: 68,
    signalStrength: "good",
    rssiDbm: -68,
    isSimulated: true,
    calibrationStatus: "Oscillometric Transducer Verified",
    assignedSensors: ["Pneumatic Oscillometric Pressure Transducer"],
  },
  {
    deviceId: `RFID-${astronautId.replace(/[^A-Za-z0-9]/g, "")}-01`,
    astronautId,
    deviceType: "rfid_scanner",
    name: "Hab-Station RFID Meal Reader",
    manufacturer: "ISS Habitation Systems",
    model: "NutriScan 13.56MHz HF",
    firmwareVersion: "v4.0.1-embedded",
    connectionType: "usb",
    status: "connected",
    batteryLevel: 100,
    signalStrength: "excellent",
    rssiDbm: -30,
    isSimulated: true,
    calibrationStatus: "ISO/IEC 14443 Type A Verified",
    assignedSensors: ["13.56MHz High-Frequency RFID / NFC Interrogator"],
  },
];

/**
 * GET /api/devices/gateway-status
 * Get the Bio-Link Edge Gateway status
 */
router.get("/gateway-status", authenticate, async (req: Request, res: Response) => {
  try {
    const astronautId = (req as any).user?.astronautId || "AST-001";
    const deviceCount = await AstronautDevice.countDocuments({
      astronautId,
      isActive: true,
      status: "connected",
    });

    const now = new Date();
    const gatewayInfo = {
      gatewayId: "BLG-001",
      name: "AstroGuard Bio-Link Edge Gateway",
      location: "Crew Habitation Module 2 · Rack 4B",
      status: "CONNECTED",
      encryption: "TLS 1.3 / AES-256-GCM Hardware Vault",
      firmware: "v4.1.9-space-rtos",
      dataStream: "LIVE 100Hz Telemetry Channel",
      activeDevices: deviceCount || 5,
      lastSync: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      lastSyncIso: now.toISOString(),
      networkMode: "Local Habitation Wi-Fi 6 + Space-Ground Telemetry Relay",
      bufferedPackets: 0,
      bufferCapacityPackets: 250000,
      protocolHierarchy: [
        { layer: "L1 Sensor-to-Wearable", protocol: "Direct Electrode / Optical / Transducer" },
        { layer: "L2 Wearable-to-Gateway", protocol: "BLE 5.3 / USB 3.0 Serial / Local Mesh" },
        { layer: "L3 Gateway-to-Backend", protocol: "Secure WSS (WebSocket) / HTTPS Mutual TLS" },
        { layer: "L4 Backend-to-Surgeon", protocol: "AstroGuard Real-Time SSE & Mission Control Telemetry" },
      ],
    };

    return successResponse(res, gatewayInfo);
  } catch (error: any) {
    return errorResponse(res, error.message || "Failed to fetch gateway status", 500);
  }
});

/**
 * GET /api/devices
 * List all paired devices for the current astronaut
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const astronautId = (req as any).user?.astronautId || "AST-001";

    let devices = await AstronautDevice.find({ astronautId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Auto-seed initial devices if none exist yet
    if (!devices || devices.length === 0) {
      const initialSeed = DEFAULT_ASTRONAUT_DEVICES(astronautId);
      await AstronautDevice.insertMany(initialSeed);
      devices = (await AstronautDevice.find({ astronautId, isActive: true })
        .sort({ createdAt: -1 })
        .lean()) as any;
    }

    return successResponse(res, devices);
  } catch (error: any) {
    return errorResponse(res, error.message || "Failed to retrieve devices", 500);
  }
});

/**
 * POST /api/devices/pair
 * Register and pair a new sensor/device
 */
router.post("/pair", authenticate, async (req: Request, res: Response) => {
  try {
    const astronautId = (req as any).user?.astronautId || "AST-001";
    const {
      deviceId,
      deviceType,
      name,
      manufacturer,
      model,
      firmwareVersion = "v1.0.0",
      connectionType = "ble",
      assignedSensors = [],
      isSimulated = true,
    } = req.body;

    if (!deviceId || !deviceType || !name || !manufacturer || !model) {
      return errorResponse(
        res,
        "Missing required device registration fields (deviceId, deviceType, name, manufacturer, model)",
        400
      );
    }

    // Check if device ID already registered
    const existing = await AstronautDevice.findOne({ deviceId });
    if (existing) {
      if (existing.astronautId !== astronautId) {
        return errorResponse(
          res,
          "Device is already registered to another astronaut account. Revoke previous pairing first.",
          403
        );
      }
      existing.isActive = true;
      existing.status = "connected";
      existing.lastSeen = new Date();
      existing.pairedAt = new Date();
      await existing.save();
      return successResponse(res, existing, "Device re-connected and paired successfully", 200);
    }

    const newDevice = await AstronautDevice.create({
      deviceId,
      astronautId,
      deviceType,
      name,
      manufacturer,
      model,
      firmwareVersion,
      connectionType,
      status: "connected",
      batteryLevel: 98,
      signalStrength: "excellent",
      rssiDbm: -48,
      lastSeen: new Date(),
      pairedAt: new Date(),
      isActive: true,
      isSimulated,
      calibrationStatus: "Validated & Calibrated for Bio-Link Stream",
      assignedSensors,
    });

    return successResponse(res, newDevice, "Device paired successfully with Bio-Link Gateway", 201);
  } catch (error: any) {
    return errorResponse(res, error.message || "Failed to pair device", 500);
  }
});

/**
 * PATCH /api/devices/:id/status
 * Update status, battery, or signal for a device
 */
router.patch("/:id/status", authenticate, async (req: Request, res: Response) => {
  try {
    const astronautId = (req as any).user?.astronautId || "AST-001";
    const { id } = req.params;
    const { status, batteryLevel, signalStrength, isSimulated } = req.body;

    const device = await AstronautDevice.findOne({
      $or: [{ _id: id }, { deviceId: id }],
      astronautId,
    });

    if (!device) {
      return errorResponse(res, "Device not found or not assigned to astronaut", 404);
    }

    if (status) device.status = status;
    if (typeof batteryLevel === "number") device.batteryLevel = batteryLevel;
    if (signalStrength) device.signalStrength = signalStrength;
    if (typeof isSimulated === "boolean") device.isSimulated = isSimulated;
    device.lastSeen = new Date();

    await device.save();
    return successResponse(res, device, "Device telemetry status updated");
  } catch (error: any) {
    return errorResponse(res, error.message || "Failed to update device status", 500);
  }
});

/**
 * DELETE /api/devices/:id
 * Unpair / Revoke device registration
 */
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const astronautId = (req as any).user?.astronautId || "AST-001";
    const { id } = req.params;

    const device = await AstronautDevice.findOne({
      $or: [{ _id: id }, { deviceId: id }],
      astronautId,
    });

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    device.isActive = false;
    device.status = "offline";
    await device.save();

    return successResponse(res, { deviceId: device.deviceId }, "Device unpaired from Bio-Link Gateway");
  } catch (error: any) {
    return errorResponse(res, error.message || "Failed to unpair device", 500);
  }
});

/**
 * POST /api/devices/sync-buffered
 * Ingest buffered telemetry packets recorded during local gateway disconnection
 */
router.post("/sync-buffered", authenticate, async (req: Request, res: Response) => {
  try {
    const astronautId = (req as any).user?.astronautId || "AST-001";
    const { packets = [] } = req.body;

    if (!Array.isArray(packets) || packets.length === 0) {
      return successResponse(res, { ingestedCount: 0 }, "No buffered packets to synchronize");
    }

    let ingestedCount = 0;
    for (const pkt of packets) {
      await TelemetryService.ingestTelemetry({
        ...pkt,
        astronautId,
        source: "sensor",
        notes: `Bio-Link Gateway Buffered Sync · Local Timestamp ${pkt.timestamp || new Date().toISOString()}`,
      });
      ingestedCount++;
    }

    return successResponse(
      res,
      { ingestedCount, syncTimestamp: new Date().toISOString() },
      `Successfully synced ${ingestedCount} buffered telemetry packets from Bio-Link Gateway.`
    );
  } catch (error: any) {
    return errorResponse(res, error.message || "Failed to sync buffered packets", 500);
  }
});

export default router;
