"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Radio,
  Bluetooth,
  Wifi,
  Usb,
  Battery,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  ArrowRight,
  Signal,
  ChevronRight,
  Database,
  Satellite,
  Lock,
  Phone,
  Hash,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  IBioLinkDevice,
  DEFAULT_DEVICE_CATALOG,
  DeviceCategory,
  ConnectionProtocol,
  SignalQuality,
} from "@/services/bioLinkGateway";
import {
  getAstronautDevices,
  pairNewDevice,
  unpairDevice,
  syncBufferedTelemetry,
} from "@/lib/api";

export default function BioLinkPage() {
  const { user } = useAuth();
  const astronautId = user?.astronautId || "AST-001";
  const astronautName = user?.name || "Commander Alex Morgan";

  // State
  const [devices, setDevices] = useState<IBioLinkDevice[]>(DEFAULT_DEVICE_CATALOG);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Blackout / Local Buffering Simulator
  const [isBlackoutActive, setIsBlackoutActive] = useState(false);
  const [bufferedCount, setBufferedCount] = useState(0);
  const [isSyncingBuffer, setIsSyncingBuffer] = useState(false);

  // Connect Device Modal
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [pairingMethod, setPairingMethod] = useState<"number" | "scan">("number");
  
  // Number/PIN Connection Form
  const [inputNumber, setInputNumber] = useState("");
  const [inputDeviceType, setInputDeviceType] = useState<DeviceCategory>("bio_patch");
  const [inputProtocol, setInputProtocol] = useState<ConnectionProtocol>("BLE 5.3");
  const [isPairingNumber, setIsPairingNumber] = useState(false);
  const [pairingSuccessDevice, setPairingSuccessDevice] = useState<IBioLinkDevice | null>(null);

  // Auto Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCandidate, setScannedCandidate] = useState<IBioLinkDevice | null>(null);

  // Load initial devices from backend
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getAstronautDevices();
        if (!active) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized: IBioLinkDevice[] = (res.data as any[]).map((d) => ({
            deviceId: d.deviceId,
            astronautId: d.astronautId || astronautId,
            deviceType: d.deviceType || "bio_patch",
            name: d.name || "Bio-Link Device",
            manufacturer: d.manufacturer || "AstroGuard BioMed",
            model: d.model || "X-1",
            firmwareVersion: d.firmwareVersion || "v2.0.1",
            connectionType: d.connectionType === "usb" ? "USB 3.0 / Serial" : d.connectionType === "wifi" ? "Local Wi-Fi 6" : "BLE 5.3",
            status: d.status || "connected",
            batteryLevel: typeof d.batteryLevel === "number" ? d.batteryLevel : 85,
            signalStrength: d.signalStrength || "excellent",
            rssiDbm: d.rssiDbm || -55,
            lastSeen: "Just now",
            pairedAt: d.pairedAt || new Date().toISOString(),
            isSimulated: d.isSimulated ?? true,
            calibrationStatus: d.calibrationStatus || "Zero-G Certified",
            assignedSensors: d.assignedSensors || ["Biometric Transducer Array"],
            dataNature: d.deviceType === "rfid_scanner" ? "RFID Ingestion" : d.deviceType === "smartwatch" ? "Derived / Algorithmic" : "Direct Sensor",
            lastMeasurementValue: d.deviceType === "bio_patch" ? "76 BPM · 98% SpO₂" : d.deviceType === "cgm" ? "94 mg/dL" : d.deviceType === "bp_monitor" ? "118/78 mmHg" : "Nominal Sync",
          }));
          setDevices(normalized);
        }
      } catch {}
    };
    void load();
  }, [astronautId]);

  // Buffer counter during blackout simulation
  useEffect(() => {
    if (!isBlackoutActive) return;
    const timer = setInterval(() => {
      setBufferedCount((prev) => prev + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, [isBlackoutActive]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Space Blackout
  const handleToggleBlackout = async () => {
    if (!isBlackoutActive) {
      setIsBlackoutActive(true);
      showToast("⚠️ Space Blackout simulated. Edge Gateway buffering all sensor data locally.");
    } else {
      setIsSyncingBuffer(true);
      showToast("🛰️ Comm Link Restored! Synchronizing buffered packets to AstroGuard Cloud...");
      try {
        const dummyPackets = Array.from({ length: Math.min(10, bufferedCount) }).map((_, i) => ({
          heartRate: 74 + (i % 3),
          spo2: 98,
          timestamp: new Date(Date.now() - (bufferedCount - i) * 1200).toISOString(),
        }));
        await syncBufferedTelemetry(dummyPackets);
      } catch {}
      setTimeout(() => {
        setIsBlackoutActive(false);
        setIsSyncingBuffer(false);
        setBufferedCount(0);
        showToast("✅ Buffer synchronized with zero data loss!");
      }, 1500);
    }
  };

  // Connect via Number / PIN / Phone / Serial ID
  const handleConnectByNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNumber.trim()) {
      showToast("⚠️ Please enter a Device Number, 6-Digit PIN, or Phone/Comms ID.");
      return;
    }

    setIsPairingNumber(true);
    const cleaned = inputNumber.trim().toUpperCase();

    setTimeout(async () => {
      const generatedId = cleaned.includes("-") ? cleaned : `DEV-${cleaned}`;
      const newDev: IBioLinkDevice = {
        deviceId: generatedId,
        astronautId,
        deviceType: inputDeviceType,
        name:
          inputDeviceType === "bio_patch"
            ? "Medical Bio-Patch Pro"
            : inputDeviceType === "smartwatch"
            ? "Astronaut Smartwatch"
            : inputDeviceType === "cgm"
            ? "GlycoSense CGM Probe"
            : inputDeviceType === "bp_monitor"
            ? "Digital BP Cuff"
            : inputDeviceType === "rfid_scanner"
            ? "Station RFID Reader"
            : "Medical Transducer",
        manufacturer: "AstroGuard Telemetry Systems",
        model: `MD-${cleaned.slice(0, 5)}`,
        firmwareVersion: "v3.2.0-rtos",
        connectionType: inputProtocol,
        status: "connected",
        batteryLevel: 95,
        signalStrength: "excellent",
        rssiDbm: -46,
        lastSeen: "Just now",
        pairedAt: new Date().toISOString(),
        isSimulated: true,
        calibrationStatus: `Paired via PIN/Number [${cleaned}]`,
        assignedSensors: ["Biometric Sensor Array"],
        dataNature: inputDeviceType === "rfid_scanner" ? "RFID Ingestion" : inputDeviceType === "smartwatch" ? "Derived / Algorithmic" : "Direct Sensor",
        lastMeasurementValue: "Connected & Transmitting",
      };

      try {
        await pairNewDevice({
          deviceId: newDev.deviceId,
          deviceType: newDev.deviceType,
          name: newDev.name,
          manufacturer: newDev.manufacturer,
          model: newDev.model,
          firmwareVersion: newDev.firmwareVersion,
          connectionType: inputProtocol === "USB 3.0 / Serial" ? "usb" : inputProtocol === "Local Wi-Fi 6" ? "wifi" : "ble",
          assignedSensors: newDev.assignedSensors,
          isSimulated: true,
        });
      } catch {}

      setDevices((prev) => [newDev, ...prev.filter((d) => d.deviceId !== newDev.deviceId)]);
      setPairingSuccessDevice(newDev);
      setIsPairingNumber(false);
      showToast(`✅ Device successfully connected via PIN/Number [${cleaned}]`);
    }, 1400);
  };

  // Start BLE Auto Scan
  const handleStartScan = () => {
    setIsScanning(true);
    setScannedCandidate(null);
    setTimeout(() => {
      setIsScanning(false);
      const randNum = Math.floor(100 + Math.random() * 900);
      const candidate: IBioLinkDevice = {
        deviceId: `BLE-PROBE-${randNum}`,
        astronautId,
        deviceType: "bio_patch",
        name: `Bio-Patch Ultra Probe #${randNum}`,
        manufacturer: "AstroGuard BioMed",
        model: "BioUltra-X",
        firmwareVersion: "v4.1.0",
        connectionType: "BLE 5.3",
        status: "connected",
        batteryLevel: 92,
        signalStrength: "excellent",
        rssiDbm: -45,
        lastSeen: "Just now",
        pairedAt: new Date().toISOString(),
        isSimulated: true,
        calibrationStatus: "Zero-G Certified",
        assignedSensors: ["Lead-II ECG", "PPG Pulse", "NTC Thermistor"],
        dataNature: "Direct Sensor",
        lastMeasurementValue: "Stream Ready",
      };
      setScannedCandidate(candidate);
    }, 2000);
  };

  // Confirm Scanned Device
  const handleConfirmScanned = async () => {
    if (!scannedCandidate) return;
    try {
      await pairNewDevice({
        deviceId: scannedCandidate.deviceId,
        deviceType: scannedCandidate.deviceType,
        name: scannedCandidate.name,
        manufacturer: scannedCandidate.manufacturer,
        model: scannedCandidate.model,
        connectionType: "ble",
        isSimulated: true,
      });
    } catch {}
    setDevices((prev) => [scannedCandidate, ...prev.filter((d) => d.deviceId !== scannedCandidate.deviceId)]);
    setPairingSuccessDevice(scannedCandidate);
    showToast(`✅ ${scannedCandidate.name} paired successfully!`);
  };

  // Remove / Unpair Device
  const handleUnpair = async (deviceId: string) => {
    try {
      await unpairDevice(deviceId);
    } catch {}
    setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
    showToast(`🔌 Device ${deviceId} removed.`);
  };

  const activeCount = useMemo(() => devices.filter((d) => d.status === "connected").length, [devices]);

  return (
    <div className="w-full space-y-6 text-[#e4f0fb] font-sans pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────
          COMPACT GATEWAY METRICS SUMMARY (3 CARDS)
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Card 1: Edge Gateway Status */}
        <div className="rounded-xl border border-[#1d2f47] bg-[#0d1726]/80 p-4 backdrop-blur-md shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#2ee6f6]/10 border border-[#2ee6f6]/20 flex items-center justify-center text-[#2ee6f6]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#7f96ae] uppercase block">Edge Gateway</span>
              <b className="text-sm text-white">Hab 2 · Rack 4B</b>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#3ddc97] bg-[#3ddc97]/10 px-2.5 py-1 rounded-lg border border-[#3ddc97]/30">
            <span className="h-2 w-2 rounded-full bg-[#3ddc97] animate-pulse" />
            LIVE 100Hz
          </span>
        </div>

        {/* Card 2: Connected Devices */}
        <div className="rounded-xl border border-[#1d2f47] bg-[#0d1726]/80 p-4 backdrop-blur-md shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#3ddc97]/10 border border-[#3ddc97]/20 flex items-center justify-center text-[#3ddc97]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#7f96ae] uppercase block">Paired Sensors</span>
              <b className="text-sm text-white">{activeCount} of {devices.length} Online</b>
            </div>
          </div>
          <span className="text-xs font-mono text-[#2ee6f6] bg-[#2ee6f6]/10 px-2.5 py-1 rounded-lg border border-[#2ee6f6]/30">
            BLE / USB Link
          </span>
        </div>

        {/* Card 3: Security & Scoping */}
        <div className="rounded-xl border border-[#1d2f47] bg-[#0d1726]/80 p-4 backdrop-blur-md shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#a98bff]/10 border border-[#a98bff]/20 flex items-center justify-center text-[#a98bff]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#7f96ae] uppercase block">Astronaut Scoping</span>
              <b className="text-sm text-white">{astronautId} · Vault OK</b>
            </div>
          </div>
          <span className="text-xs font-mono text-[#a98bff] bg-[#a98bff]/10 px-2.5 py-1 rounded-lg border border-[#a98bff]/30">
            TLS 1.3 Vault
          </span>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          CONNECTED SENSORS & DEVICES SECTION HEADER
      ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#1d2f47] pb-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#7f96ae] uppercase">
          <span className="text-[#2ee6f6]">▌</span> Active Biometric Sensors &amp; Wearables ({devices.length})
        </div>

        <button
          type="button"
          onClick={() => {
            setPairingSuccessDevice(null);
            setInputNumber("");
            setPairingModalOpen(true);
          }}
          className="text-xs font-mono text-[#2ee6f6] hover:underline flex items-center gap-1"
        >
          <span>+ Connect by Phone / PIN Number</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────
          CONNECTED DEVICES GRID
      ───────────────────────────────────────────────────────── */}
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const isOnline = device.status === "connected";
            return (
              <div
                key={device.deviceId}
                className="rounded-2xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 backdrop-blur-md shadow-md flex flex-col justify-between transition-all hover:border-[#2ee6f6]/40 hover:shadow-[0_8px_20px_-8px_rgba(46,230,246,0.2)] relative"
              >
                <div>
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 ${
                          isOnline
                            ? "border-[#3ddc97]/40 bg-[#3ddc97]/15 text-[#3ddc97]"
                            : "border-[#ff5468]/40 bg-[#ff5468]/15 text-[#ff5468]"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-[#3ddc97] animate-pulse" : "bg-[#ff5468]"}`} />
                        {isOnline ? "LIVE" : "OFFLINE"}
                      </span>

                      {device.isSimulated && (
                        <span className="px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold border border-[#ffb547]/40 bg-[#ffb547]/10 text-[#ffb547]">
                          SIMULATION
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnpair(device.deviceId)}
                      title="Unpair Device"
                      className="text-[#7f96ae] hover:text-[#ff5468] p-1 rounded-lg hover:bg-white/5 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Device Identity */}
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-10 w-10 rounded-xl bg-[#2ee6f6]/10 border border-[#1d2f47] flex items-center justify-center text-[#2ee6f6] shrink-0">
                      {device.connectionType === "USB 3.0 / Serial" ? (
                        <Usb className="h-5 w-5" />
                      ) : device.connectionType === "Local Wi-Fi 6" ? (
                        <Wifi className="h-5 w-5" />
                      ) : (
                        <Bluetooth className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{device.name}</h3>
                      <code className="text-[11px] font-mono text-[#2ee6f6] block truncate">{device.deviceId}</code>
                    </div>
                  </div>

                  {/* Details Table */}
                  <div className="space-y-1.5 font-mono text-xs mt-3 pt-3 border-t border-[#1d2f47]/60">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#7f96ae] font-sans">Protocol</span>
                      <span className="text-[#2ee6f6] font-bold">{device.connectionType}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#7f96ae] font-sans">Signal RSSI</span>
                      <span className="text-[#3ddc97] flex items-center gap-1">
                        <Signal className="h-3 w-3" /> {device.signalStrength.toUpperCase()} ({device.rssiDbm} dBm)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#7f96ae] font-sans">Battery</span>
                      <span className="text-white flex items-center gap-1">
                        <Battery className="h-3 w-3 text-[#3ddc97]" /> {device.batteryLevel}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#7f96ae] font-sans">Data Category</span>
                      <span className="text-[#ffb547]">{device.dataNature}</span>
                    </div>
                  </div>

                  {/* Measurement Readout */}
                  {device.lastMeasurementValue && (
                    <div className="mt-2.5 p-2 rounded-xl bg-[#070d16] border border-[#1d2f47] text-xs font-mono">
                      <span className="text-[9.5px] text-[#7f96ae] block font-sans">Live Stream Payload</span>
                      <span className="text-[#3ddc97] font-bold">{device.lastMeasurementValue}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#7f96ae] pt-2.5 mt-3 border-t border-[#1d2f47]/60">
                  <span>{device.calibrationStatus}</span>
                  <span>Sync: {device.lastSeen}</span>
                </div>
              </div>
            );
          })}

          {/* Quick Add Card */}
          <div
            onClick={() => {
              setPairingSuccessDevice(null);
              setInputNumber("");
              setPairingModalOpen(true);
            }}
            className="rounded-2xl border-2 border-dashed border-[#1d2f47] hover:border-[#2ee6f6]/50 bg-[#070d16]/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group min-h-[220px]"
          >
            <div className="h-12 w-12 rounded-2xl bg-[#2ee6f6]/10 border border-[#2ee6f6]/30 flex items-center justify-center text-[#2ee6f6] group-hover:scale-110 transition shadow-[0_0_15px_rgba(46,230,246,0.15)] mb-3">
              <Plus className="h-6 w-6" />
            </div>
            <b className="text-sm text-white group-hover:text-[#2ee6f6] transition">Pair Another Device</b>
            <p className="text-xs text-[#7f96ae] mt-1 max-w-xs">
              Enter a 6-digit Device PIN, Hardware Number, or Mobile/Satellite ID
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          PAIRING MODAL: PIN / NUMBER / PHONE & BLE SCAN
      ───────────────────────────────────────────────────────── */}
      {pairingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070d16]/85 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#1d2f47] bg-[#0d1726] p-6 shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1d2f47] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#2ee6f6] font-bold uppercase tracking-wider">
                  Device Hardware Provisioning
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">Pair Biometric Device</h3>
              </div>
              <button
                type="button"
                onClick={() => setPairingModalOpen(false)}
                className="rounded-lg p-1.5 text-[#7f96ae] hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Method Tabs: Number/PIN vs BLE Scan */}
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setPairingMethod("number");
                  setPairingSuccessDevice(null);
                }}
                className={`py-2 rounded-xl border flex items-center justify-center gap-2 transition ${
                  pairingMethod === "number"
                    ? "border-[#2ee6f6] bg-[#2ee6f6]/15 text-[#2ee6f6] font-bold shadow-sm"
                    : "border-[#1d2f47] bg-[#070d16] text-[#7f96ae] hover:text-white"
                }`}
              >
                <Hash className="h-4 w-4" />
                <span>Pair by Number / PIN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPairingMethod("scan");
                  setPairingSuccessDevice(null);
                }}
                className={`py-2 rounded-xl border flex items-center justify-center gap-2 transition ${
                  pairingMethod === "scan"
                    ? "border-[#2ee6f6] bg-[#2ee6f6]/15 text-[#2ee6f6] font-bold shadow-sm"
                    : "border-[#1d2f47] bg-[#070d16] text-[#7f96ae] hover:text-white"
                }`}
              >
                <Bluetooth className="h-4 w-4" />
                <span>BLE Auto-Scan</span>
              </button>
            </div>

            {/* SUCCESS VIEW */}
            {pairingSuccessDevice ? (
              <div className="py-4 text-center space-y-3 animate-fade-in">
                <div className="mx-auto h-14 w-14 rounded-full bg-[#3ddc97]/20 border border-[#3ddc97] flex items-center justify-center text-[#3ddc97] shadow-[0_0_20px_rgba(61,220,151,0.3)]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Device Connected Successfully!</h4>
                  <p className="text-xs font-mono text-[#3ddc97] mt-1">{pairingSuccessDevice.deviceId}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070d16] border border-[#1d2f47] text-xs font-mono max-w-xs mx-auto text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#7f96ae]">Assigned Astronaut</span>
                    <span className="text-white">{astronautId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f96ae]">Protocol</span>
                    <span className="text-[#2ee6f6]">{pairingSuccessDevice.connectionType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f96ae]">Telemetry Stream</span>
                    <span className="text-[#3ddc97]">LIVE 100Hz</span>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPairingModalOpen(false)}
                    className="rounded-xl bg-[#2ee6f6] px-6 py-2.5 text-xs font-bold text-[#070d16] hover:bg-[#20cbd9]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : pairingMethod === "number" ? (
              /* FORM: PAIR BY NUMBER / PIN */
              <form onSubmit={handleConnectByNumber} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    Device PIN, Number, or Mobile/Satellite ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7f96ae]" />
                    <input
                      type="text"
                      value={inputNumber}
                      onChange={(e) => setInputNumber(e.target.value)}
                      placeholder="e.g. 849-210, BP-9942, or +1-800-ASTRO-01"
                      className="w-full rounded-xl border border-[#1d2f47] bg-[#070d16] pl-9 pr-3 py-2.5 text-xs font-mono text-white placeholder:text-[#7f96ae] outline-none focus:border-[#2ee6f6]"
                    />
                  </div>
                  <span className="text-[10px] text-[#7f96ae] mt-1 block">
                    Enter the 6-digit code on the device screen or the hardware label serial number.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">Device Type</label>
                    <select
                      value={inputDeviceType}
                      onChange={(e) => setInputDeviceType(e.target.value as DeviceCategory)}
                      className="w-full rounded-xl border border-[#1d2f47] bg-[#070d16] px-3 py-2 text-xs text-white outline-none focus:border-[#2ee6f6]"
                    >
                      <option value="bio_patch">Bio-Patch (ECG/PPG)</option>
                      <option value="smartwatch">Tactical Smartwatch</option>
                      <option value="cgm">Continuous Glucose Monitor</option>
                      <option value="bp_monitor">Blood Pressure Cuff</option>
                      <option value="pulse_oximeter">Pulse Oximeter</option>
                      <option value="rfid_scanner">RFID Meal Reader</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">Connection Protocol</label>
                    <select
                      value={inputProtocol}
                      onChange={(e) => setInputProtocol(e.target.value as ConnectionProtocol)}
                      className="w-full rounded-xl border border-[#1d2f47] bg-[#070d16] px-3 py-2 text-xs text-white outline-none focus:border-[#2ee6f6]"
                    >
                      <option value="BLE 5.3">BLE 5.3 (Recommended)</option>
                      <option value="USB 3.0 / Serial">USB 3.0 / Serial</option>
                      <option value="Local Wi-Fi 6">Local Wi-Fi 6</option>
                      <option value="Gateway Direct">Gateway Direct</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPairingModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#1d2f47] text-xs text-[#7f96ae] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPairingNumber || !inputNumber.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2ee6f6] to-[#3ddc97] px-5 py-2 text-xs font-bold text-[#070d16] hover:opacity-90 disabled:opacity-40 transition"
                  >
                    {isPairingNumber ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Verifying PIN...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Pair with Number</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* BLE AUTO SCAN */
              <div className="space-y-4 text-center py-4">
                {isScanning ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto h-16 w-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-[#2ee6f6] animate-ping opacity-40" />
                      <div className="h-12 w-12 rounded-full bg-[#2ee6f6]/20 border border-[#2ee6f6] flex items-center justify-center text-[#2ee6f6]">
                        <Radio className="h-6 w-6 animate-pulse" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white">Scanning 2.4GHz BLE Spectrum...</h4>
                    <p className="text-xs text-[#7f96ae]">Holding near Bio-Link Gateway BLG-001</p>
                  </div>
                ) : scannedCandidate ? (
                  <div className="space-y-3 animate-fade-in text-left p-4 rounded-xl border border-[#3ddc97]/40 bg-[#3ddc97]/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-[#3ddc97] font-bold">1 DEVICE DISCOVERED</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{scannedCandidate.name}</h4>
                        <code className="text-xs font-mono text-[#2ee6f6]">{scannedCandidate.deviceId}</code>
                      </div>
                      <span className="text-xs font-mono text-[#3ddc97] bg-[#3ddc97]/20 px-2 py-0.5 rounded">
                        -45 dBm
                      </span>
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleStartScan}
                        className="px-3 py-1.5 rounded-xl border border-[#1d2f47] text-xs text-[#7f96ae]"
                      >
                        Rescan
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmScanned}
                        className="px-4 py-1.5 rounded-xl bg-[#3ddc97] text-xs font-bold text-[#070d16] hover:bg-[#32be82]"
                      >
                        Confirm &amp; Pair
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-[#7f96ae]">
                      Ensure your wearable or sensor is in pairing mode within 5 meters of Gateway BLG-001.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartScan}
                      className="px-5 py-2.5 rounded-xl bg-[#2ee6f6] text-xs font-bold text-[#070d16] hover:bg-[#20cbd9]"
                    >
                      Start Auto-Scan
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] rounded-xl border border-[#2ee6f6] bg-[#0d1726] px-5 py-2.5 text-xs font-mono text-[#e4f0fb] shadow-[0_0_25px_rgba(46,230,246,0.4)] animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
