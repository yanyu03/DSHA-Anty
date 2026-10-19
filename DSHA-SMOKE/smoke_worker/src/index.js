export default {
  async fetch(request, env, ctx) {
    const data = {
      message: "Hello from DSHA-SMOKE Edge Carnival!",
      timestamp: new Date().toISOString(),
      engine: env.ENGINE,
      environment: env.ENVIRONMENT,
      status: 200
    };
    return new Response(JSON.stringify(data, null, 2), {
      headers: { "content-type": "application/json;charset=UTF-8" }
    });
  }
};
