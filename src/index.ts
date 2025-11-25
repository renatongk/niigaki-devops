import app from './app';
import config from './config';

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 Ceasa SaaS API running on port ${PORT}`);
  console.log(`📚 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
});
