import { Request, Response, NextFunction } from "express";
import { BioSample } from "../models/BioSample.js";
import { successResponse, errorResponse } from "../utils/response.js";

function astronautId(req: Request) { return req.user?.astronautId; }
function prescription(sample: any) {
  const hydration = Number(sample?.urine?.hydrationLevel ?? 70);
  const sodiumLoss = Number(sample?.urine?.sodiumLoss ?? 0);
  const cortisol = Number(sample?.saliva?.cortisol ?? 0);
  const inflammation = Number(sample?.stool?.giInflammationMarkers ?? 0);
  const liters = Math.max(1.2, Math.min(3.2, 1.6 + (70 - hydration) * 0.012 + sodiumLoss * 0.01 + (cortisol > 18 ? 0.2 : 0)));
  const glasses = Math.round((liters / 0.25) * 2) / 2;
  const advice = [hydration < 60 ? "Increase electrolyte-balanced water intake during the next 4 hours." : "Maintain steady water intake across the mission day."];
  if (sodiumLoss > 4) advice.push("Pair fluids with the prescribed sodium replacement protocol.");
  if (cortisol > 18) advice.push("Prioritize recovery sleep and reduce non-essential workload.");
  if (inflammation > 20) advice.push("Choose low-irritant, fiber-balanced nutrition and flag GI symptoms to Medical Operations.");
  return { waterLiters: Number(liters.toFixed(1)), glasses, hydrationBand: hydration < 60 ? "Dehydration risk" : hydration < 78 ? "Monitor" : "Nominal", advice, generatedAt: new Date().toISOString(), sampleId: sample?._id };
}

export class BioSampleController {
  static async create(req: Request, res: Response, next: NextFunction) { try {
    const id = astronautId(req); if (!id) return errorResponse(res, "Astronaut profile is not linked to this account.", 400);
    const body = req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
    const sample = await BioSample.create({ astronautId: id, source: body.source || (body.fileName?.toLowerCase().endsWith(".pdf") ? "pdf" : "manual"), urine: body.urine || {}, stool: body.stool || {}, saliva: body.saliva || {}, cbcScan: body.cbcScan || body.cbc || {}, symptomLog: body.symptomLog || {}, notes: body.notes, fileName: body.fileName });
    return successResponse(res, { sample, prescription: prescription(sample) }, 201, "Bio-sample recorded and hydration prescription generated.");
  } catch (error) { next(error); } }
  static async latest(req: Request, res: Response, next: NextFunction) { try { const id = astronautId(req); if (!id) return errorResponse(res, "Astronaut profile is not linked to this account.", 400); const sample = await BioSample.findOne({ astronautId: id }).sort({ createdAt: -1 }); return successResponse(res, { sample, prescription: prescription(sample) }, 200); } catch (error) { next(error); } }
  static async history(req: Request, res: Response, next: NextFunction) { try { const id = astronautId(req); if (!id) return errorResponse(res, "Astronaut profile is not linked to this account.", 400); const samples = await BioSample.find({ astronautId: id }).sort({ createdAt: -1 }).limit(20); return successResponse(res, samples, 200); } catch (error) { next(error); } }
}
