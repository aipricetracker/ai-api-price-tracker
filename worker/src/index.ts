export interface Env {}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", service: "collector" });
    }

    return Response.json({
      service: "ai-api-price-tracker-worker",
      message: "Collector PoC entrypoint",
    });
  },

  async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext): Promise<void> {
    // PoC: scheduled collection logic will be implemented later.
  },
};
