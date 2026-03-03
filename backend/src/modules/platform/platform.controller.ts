import type { Request, Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { PlatformService } from "./platform.service.js";

const platformService = new PlatformService();

export class PlatformController extends BaseController {
  getConfig = async (_req: Request, res: Response): Promise<void> => {
    const data = await platformService.getConfig();
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  getFeatures = async (_req: Request, res: Response): Promise<void> => {
    const data = await platformService.getFeatures();
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  getVersion = async (_req: Request, res: Response): Promise<void> => {
    const data = await platformService.getVersion();
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const data = await platformService.getSystemHealth();
    const status = data.ok ? 200 : 503;
    res.status(status).json({ success: data.ok, code: "SUCCESS", message: "", data });
  };
}
